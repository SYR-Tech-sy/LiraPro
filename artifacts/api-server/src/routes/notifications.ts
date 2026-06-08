import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { notificationLogTable } from "@workspace/db";
import { and, eq, or, isNull, desc } from "drizzle-orm";
import { sendPushToAll } from "./push.js";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import {
  addSseClient,
  removeSseClient,
  broadcastSSE,
  emitNotification,
  makeNotifDedup,
  isDuplicate,
  updateNotifLogStatus,
  logNotification,
} from "../services/notificationService.js";
import { verifyDeliveryReceipt } from "../lib/deliveryReceipt.js";

const router: IRouter = Router();

let connCounter = 0;

// ── SSE stream ────────────────────────────────────────────────────────────────

router.get("/notifications/stream", async (req, res): Promise<void> => {
  const { verifySupabaseToken } = await import("../lib/supabase-admin.js");
  const tokenFromHeader = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "").trim();
  const tokenFromQuery = (req.query.token as string | undefined) ?? "";
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await verifySupabaseToken(token);
  if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

  const userId = user.id;
  const clientId = `${userId}-${connCounter++}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
  addSseClient(clientId, userId, res);

  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); } catch { clearInterval(heartbeat); }
  }, 25_000);
  req.on("close", () => { clearInterval(heartbeat); removeSseClient(clientId); });
});

// ── JSON storage (write mirror for legacy admin panel compat) ─────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const NOTIFICATIONS_FILE = join(__dir, "../notifications.json");
const USER_NOTIFICATIONS_FILE = join(__dir, "../user-notifications.json");
const VIEWS_FILE = join(__dir, "../notification-views.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "SYRSYP2026ADMIN";

interface NotifJson {
  id: number; title: string; body: string;
  type: string; icon: string; sender?: string;
  recipient?: "all" | "specific"; targetWalletId?: string; targetName?: string;
  createdAt: string;
}

function readNotifications(): NotifJson[] {
  try {
    if (!existsSync(NOTIFICATIONS_FILE)) return [];
    return JSON.parse(readFileSync(NOTIFICATIONS_FILE, "utf-8")) as NotifJson[];
  } catch { return []; }
}
function saveNotifications(n: NotifJson[]): void {
  try { writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(n, null, 2), "utf-8"); } catch {}
}
function readUserNotifications(): Record<string, NotifJson[]> {
  try {
    if (!existsSync(USER_NOTIFICATIONS_FILE)) return {};
    return JSON.parse(readFileSync(USER_NOTIFICATIONS_FILE, "utf-8")) as Record<string, NotifJson[]>;
  } catch { return {}; }
}
function saveUserNotifications(data: Record<string, NotifJson[]>): void {
  try { writeFileSync(USER_NOTIFICATIONS_FILE, JSON.stringify(data, null, 2), "utf-8"); } catch {}
}

// ── GET /api/notifications — DB-backed, JSON fallback ─────────────────────────

router.get("/notifications", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(notificationLogTable)
      .where(eq(notificationLogTable.recipientType, "all"))
      .orderBy(desc(notificationLogTable.createdAt))
      .limit(50);
    if (rows.length > 0) {
      res.json(rows.map(r => ({
        id: r.notifId, title: r.title, body: r.body,
        type: r.type, icon: r.icon,
        sender: r.userId ?? undefined,
        recipient: "all",
        createdAt: r.createdAt.toISOString(),
      })));
      return;
    }
  } catch { /* fallthrough */ }
  res.json(readNotifications().slice(-50).reverse());
});

// ── POST /api/notifications — admin; type: info|warning|success|price|broadcast
router.post("/notifications", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }

  const { title, body, type = "info", icon = "bell", sender } = req.body as NotifJson;
  if (!title || !body) { res.status(400).json({ error: "title and body are required" }); return; }

  const dedupHash = makeNotifDedup(type, title);
  if (await isDuplicate(dedupHash)) {
    res.status(409).json({ error: "Duplicate notification — identical message sent within the last 60 seconds" });
    return;
  }

  const notifId = Date.now();
  const newNotification: NotifJson = {
    id: notifId, title, body, type, icon,
    ...(sender ? { sender } : {}),
    recipient: "all",
    createdAt: new Date().toISOString(),
  };

  // DB write FIRST (primary)
  const logId = await logNotification({
    notifId, title, body, type, icon,
    userId: sender,
    recipientType: "all",
    actionUrl: "/app/home",
  });
  // JSON mirror (legacy compat)
  const notifications = readNotifications();
  notifications.push(newNotification);
  saveNotifications(notifications);

  req.log.info({ id: notifId }, "Global notification created");
  broadcastSSE("notification", newNotification);
  res.json(newNotification);

  // Push after responding
  const result = await sendPushToAll(title, body, "/app/home", notifId, type).catch(() => ({ sent: 0, failed: 0 }));
  if (logId !== null) void updateNotifLogStatus(logId, result.sent > 0 ? "sent" : "failed");
});

// ── GET /api/notifications/user — auth required; user sees only their own ─────
// walletId query param must match the authenticated user's Supabase UUID.
// Admin token bearer may query any walletId.

router.get("/notifications/user", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const adminToken = req.headers["x-admin-token"] as string | undefined;
  const walletId = req.query.walletId as string;
  if (!walletId) { res.status(400).json({ error: "walletId required" }); return; }

  // Ownership check: only the owner or an admin can view per-user notifications
  if (walletId !== userId && (!adminToken || adminToken !== ADMIN_TOKEN)) {
    res.status(403).json({ error: "Forbidden — can only view your own notifications" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(notificationLogTable)
      .where(eq(notificationLogTable.targetUserId, walletId))
      .orderBy(desc(notificationLogTable.createdAt))
      .limit(50);
    if (rows.length > 0) {
      res.json(rows.map(r => ({
        id: r.notifId, title: r.title, body: r.body,
        type: r.type, icon: r.icon,
        sender: r.userId ?? undefined,
        recipient: "specific",
        targetWalletId: r.targetUserId ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })));
      return;
    }
  } catch { /* fallthrough */ }
  res.json((readUserNotifications()[walletId] ?? []).slice(0, 50));
});

// ── POST /api/notifications/user — admin; type: admin|alert|wallet|info|warning|success
router.post("/notifications/user", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const { walletId, title, body, type = "admin", icon = "admin", sender, targetName, actionUrl } = req.body as {
    walletId: string; title: string; body: string; type?: string; icon?: string;
    sender?: string; targetName?: string; actionUrl?: string;
  };
  if (!walletId || !title || !body) {
    res.status(400).json({ error: "walletId, title, body required" }); return;
  }

  const result = await emitNotification({
    title, body, type, icon,
    recipientType: "user",
    targetUserId: walletId,
    actionUrl: actionUrl ?? "/app/home",
    sender,
  });

  if (result.deduplicated) {
    res.status(409).json({ error: "Duplicate notification — identical message sent within the last 60 seconds" });
    return;
  }

  // JSON mirror
  const newMsg: NotifJson = {
    id: result.notifId, title, body, type, icon,
    ...(sender ? { sender } : {}),
    recipient: "specific",
    targetWalletId: walletId,
    ...(targetName ? { targetName } : {}),
    createdAt: new Date().toISOString(),
  };
  const all = readUserNotifications();
  if (!all[walletId]) all[walletId] = [];
  all[walletId].unshift(newMsg);
  all[walletId] = all[walletId].slice(0, 30);
  saveUserNotifications(all);

  req.log.info({ walletId, id: result.notifId }, "User notification sent");
  res.json(newMsg);
});

// ── PUT /api/notifications/:id — admin only ───────────────────────────────────

router.put("/notifications/:id", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const id = parseInt((req.params as { id: string }).id ?? "0");
  const { title, body } = req.body as { title?: string; body?: string };
  const notifications = readNotifications();
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  if (title) notifications[idx]!.title = title;
  if (body) notifications[idx]!.body = body;
  saveNotifications(notifications);
  res.json(notifications[idx]);
});

// ── PUT /api/notifications/user/:walletId/:id — admin only ───────────────────

router.put("/notifications/user/:walletId/:id", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const { walletId, id: idStr } = req.params as { walletId: string; id: string };
  const id = parseInt(idStr ?? "0");
  const { title, body } = req.body as { title?: string; body?: string };
  const all = readUserNotifications();
  const userMsgs = all[walletId] ?? [];
  const idx = userMsgs.findIndex(n => n.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  if (title) userMsgs[idx]!.title = title;
  if (body) userMsgs[idx]!.body = body;
  all[walletId] = userMsgs;
  saveUserNotifications(all);
  res.json(userMsgs[idx]);
});

// ── DELETE /api/notifications/user/:walletId/all — requires auth ──────────────
// walletId must match authenticated user OR admin token.

router.delete("/notifications/user/:walletId/all", requireSupabaseAuth, (req, res): void => {
  const { walletId } = req.params as { walletId: string };
  const userId = req.supabaseUserId!;
  const adminToken = req.headers["x-admin-token"] as string | undefined;
  if (!walletId) { res.status(400).json({ error: "walletId required" }); return; }
  if (walletId !== userId && (!adminToken || adminToken !== ADMIN_TOKEN)) {
    res.status(403).json({ error: "Forbidden — can only clear your own notifications" }); return;
  }
  const all = readUserNotifications();
  all[walletId] = [];
  saveUserNotifications(all);
  res.json({ success: true });
});

// ── DELETE /api/notifications/user/:walletId/:id — admin only ────────────────

router.delete("/notifications/user/:walletId/:id", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const { walletId, id: idStr } = req.params as { walletId: string; id: string };
  const id = parseInt(idStr ?? "0");
  const all = readUserNotifications();
  if (all[walletId]) { all[walletId] = all[walletId].filter(n => n.id !== id); }
  saveUserNotifications(all);
  res.json({ success: true });
});

// ── View Tracking ─────────────────────────────────────────────────────────────

interface ViewRecord { walletId: string; viewedAt: string; }
type ViewsData = Record<string, ViewRecord[]>;

function readViews(): ViewsData {
  try {
    if (!existsSync(VIEWS_FILE)) return {};
    return JSON.parse(readFileSync(VIEWS_FILE, "utf-8")) as ViewsData;
  } catch { return {}; }
}
function saveViews(data: ViewsData): void {
  try { writeFileSync(VIEWS_FILE, JSON.stringify(data, null, 2), "utf-8"); } catch {}
}

// POST /api/notifications/:id/delivered — SW background sync (no session auth)
// Protected by HMAC receipt embedded in the push payload at send time.
// Receipt = HMAC-SHA256(notifId:walletId, SESSION_SECRET).slice(0,32).
// Without a valid receipt the update is silently skipped (still 200 to not leak info).
router.post("/notifications/:id/delivered", async (req, res): Promise<void> => {
  const id = String((req.params as { id: string }).id ?? "");
  const { walletId, receipt } = req.body as { walletId?: string; receipt?: string };
  if (!walletId) { res.status(400).json({ error: "walletId required" }); return; }
  const numericId = parseInt(id);
  if (!isNaN(numericId) && receipt && verifyDeliveryReceipt(numericId, walletId, receipt)) {
    void db
      .update(notificationLogTable)
      .set({ status: "delivered" })
      .where(
        and(
          eq(notificationLogTable.notifId, numericId),
          eq(notificationLogTable.status, "sent"),
          or(
            eq(notificationLogTable.targetUserId, walletId),
            isNull(notificationLogTable.targetUserId),
          ),
        ),
      )
      .catch(() => {});
  }
  // Always 200 — avoid leaking whether the receipt is valid
  res.json({ ok: true });
});

// POST /api/notifications/:id/view — authenticated; transitions delivered/sent → read
router.post("/notifications/:id/view", requireSupabaseAuth, async (req, res): Promise<void> => {
  const id = String((req.params as { id: string }).id ?? "");
  const userId = req.supabaseUserId!;
  const views = readViews();
  if (!views[id]) views[id] = [];
  const already = views[id].some((v: ViewRecord) => v.walletId === userId);
  if (!already) {
    views[id].push({ walletId: userId, viewedAt: new Date().toISOString() });
    saveViews(views);
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      void db
        .update(notificationLogTable)
        .set({ status: "read" })
        .where(
          and(
            eq(notificationLogTable.notifId, numericId),
            or(
              eq(notificationLogTable.targetUserId, userId),
              isNull(notificationLogTable.targetUserId),
            ),
          ),
        )
        .catch(() => {});
    }
  }
  res.json({ success: true, count: views[id].length });
});

// GET /api/notifications/:id/viewers — admin only
router.get("/notifications/:id/viewers", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const id = (req.params as { id: string }).id ?? "";
  const list = readViews()[id] ?? [];
  res.json({ id, count: list.length, viewers: list });
});

// DELETE /api/notifications/:id — admin only
router.delete("/notifications/:id", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const id = parseInt((req.params as { id: string }).id ?? "0");
  saveNotifications(readNotifications().filter(n => n.id !== id));
  res.json({ success: true });
});

// ── Live Broadcast ─────────────────────────────────────────────────────────────

interface BroadcastData {
  speed?: 'slow' | 'normal' | 'fast'; text: string; textColor: string;
  countdown?: number; countdownColor?: string; startedAt: string; endsAt?: string;
}
let activeBroadcast: BroadcastData | null = null;

router.get("/broadcast", (_req, res): void => {
  if (!activeBroadcast) { res.json(null); return; }
  if (activeBroadcast.endsAt && new Date(activeBroadcast.endsAt) < new Date()) {
    activeBroadcast = null; res.json(null); return;
  }
  res.json(activeBroadcast);
});

router.post("/broadcast", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  const { text, textColor = "#ffffff", countdown, countdownColor = "#ff4444", speed = "normal" } = req.body as {
    text: string; textColor?: string; countdown?: number; countdownColor?: string; speed?: 'slow' | 'normal' | 'fast';
  };
  if (!text?.trim()) { res.status(400).json({ error: "text required" }); return; }
  activeBroadcast = {
    text: text.trim(), textColor, speed, startedAt: new Date().toISOString(),
    ...(countdown && countdown > 0 ? {
      countdown, countdownColor, endsAt: new Date(Date.now() + countdown * 1000).toISOString(),
    } : {}),
  };

  broadcastSSE("broadcast", activeBroadcast);
  res.json(activeBroadcast);

  // Log broadcast notification to DB + push (type: broadcast)
  void emitNotification({
    title: "🔴 بث مباشر — LiraPro",
    body: text.trim(),
    type: "broadcast",
    icon: "broadcast",
    recipientType: "all",
    actionUrl: "/app/home",
  }).catch(() => {});
});

router.delete("/broadcast", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  activeBroadcast = null;
  broadcastSSE("broadcast_end", {});
  res.json({ success: true });
});

export default router;
