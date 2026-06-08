import { createHash } from "crypto";
import { type Response } from "express";
import { db } from "@workspace/db";
import { notificationLogTable } from "@workspace/db";
import { and, gt, eq, or, desc } from "drizzle-orm";
import { sendPushToAll, sendPushToUser } from "../routes/push.js";

// ── SSE Client Registry ────────────────────────────────────────────────────────

interface SseClient { userId: string; res: Response; }
const sseClients = new Map<string, SseClient>();

export function addSseClient(clientId: string, userId: string, res: Response): void {
  sseClients.set(clientId, { userId, res });
}

export function removeSseClient(clientId: string): void {
  sseClients.delete(clientId);
}

export function broadcastSSE(event: string, data: unknown, targetUserId?: string): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, client] of sseClients) {
    if (targetUserId && client.userId !== targetUserId) continue;
    try { client.res.write(payload); } catch { /* client disconnected */ }
  }
}

// ── Dedup ──────────────────────────────────────────────────────────────────────
// Key: (targetUserId ?? "__broadcast__") :: type :: title — 60-second window.
// Body is intentionally excluded: the same event type + title from the same
// recipient bucket should never fire twice within 60s regardless of body copy.

export function makeNotifDedup(type: string, title: string, targetUserId?: string): string {
  return createHash("sha256")
    .update(`${targetUserId ?? "__broadcast__"}::${type}::${title}`)
    .digest("hex")
    .slice(0, 32);
}

export async function isDuplicate(dedupHash: string): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - 60_000);
    const rows = await db
      .select({ logId: notificationLogTable.logId })
      .from(notificationLogTable)
      .where(and(eq(notificationLogTable.dedupHash, dedupHash), gt(notificationLogTable.createdAt, cutoff)))
      .limit(1);
    return rows.length > 0;
  } catch { return false; }
}

// ── DB Write ───────────────────────────────────────────────────────────────────

export async function logNotification(opts: {
  notifId: number; title: string; body: string; type: string; icon: string;
  recipientType: string; targetUserId?: string; actionUrl?: string; userId?: string;
}): Promise<number | null> {
  try {
    const dedupHash = makeNotifDedup(opts.type, opts.title, opts.targetUserId);
    const rows = await db
      .insert(notificationLogTable)
      .values({
        notifId: opts.notifId,
        title: opts.title,
        body: opts.body,
        type: opts.type,
        icon: opts.icon,
        userId: opts.userId ?? null,
        recipientType: opts.recipientType,
        targetUserId: opts.targetUserId ?? null,
        actionUrl: opts.actionUrl ?? "/app/home",
        status: "queued",
        dedupHash,
      })
      .returning({ logId: notificationLogTable.logId });
    return rows[0]?.logId ?? null;
  } catch { return null; }
}

export async function updateNotifLogStatus(
  logId: number,
  status: "sent" | "failed" | "delivered" | "read",
): Promise<void> {
  try {
    await db
      .update(notificationLogTable)
      .set({ status, ...(status === "sent" ? { sentAt: new Date() } : {}) })
      .where(eq(notificationLogTable.logId, logId));
  } catch { /* non-critical */ }
}

// ── Unified Emit ───────────────────────────────────────────────────────────────

export interface EmitNotificationOpts {
  title: string;
  body: string;
  /** One of: info | warning | success | price | admin | alert | wallet | broadcast */
  type: string;
  icon?: string;
  recipientType: "all" | "user";
  /** Supabase user UUID — required when recipientType === "user" */
  targetUserId?: string;
  actionUrl?: string;
  /** Admin/sender identifier stored in userId column */
  sender?: string;
}

export interface EmitResult {
  notifId: number;
  logId: number | null;
  sent: number;
  failed: number;
  /** true when a duplicate was detected and the notification was suppressed */
  deduplicated: boolean;
}

/**
 * Full notification pipeline:
 *   1. Dedup check (60s window, keyed on targetUserId + type + title)
 *   2. DB insert (status: queued)
 *   3. SSE push to connected clients
 *   4. Web push via VAPID
 *   5. DB status update → sent | failed
 *
 * Returns { notifId, logId, sent, failed, deduplicated }.
 * Never throws — all errors are swallowed internally.
 */
export async function emitNotification(opts: EmitNotificationOpts): Promise<EmitResult> {
  const {
    title, body, type, icon = "bell",
    recipientType, targetUserId, actionUrl = "/app/home", sender,
  } = opts;

  const dedupHash = makeNotifDedup(type, title, targetUserId);
  if (await isDuplicate(dedupHash)) {
    return { notifId: 0, logId: null, sent: 0, failed: 0, deduplicated: true };
  }

  const notifId = Date.now();

  // DB write (primary store)
  const logId = await logNotification({
    notifId, title, body, type, icon,
    userId: sender,
    recipientType,
    targetUserId,
    actionUrl,
  });

  // SSE
  const ssePayload = {
    id: notifId, title, body, type, icon,
    ...(sender ? { sender } : {}),
    recipient: recipientType,
    ...(targetUserId ? { targetWalletId: targetUserId } : {}),
    createdAt: new Date().toISOString(),
  };
  broadcastSSE("notification", ssePayload, recipientType === "user" ? targetUserId : undefined);

  // Push
  let result: { sent: number; failed: number };
  try {
    if (recipientType === "user" && targetUserId) {
      result = await sendPushToUser(targetUserId, title, body, actionUrl, notifId, type);
    } else {
      result = await sendPushToAll(title, body, actionUrl, notifId, type);
    }
  } catch {
    result = { sent: 0, failed: 0 };
  }

  if (logId !== null) {
    void updateNotifLogStatus(logId, result.sent > 0 ? "sent" : "failed");
  }

  return { notifId, logId, sent: result.sent, failed: result.failed, deduplicated: false };
}

// ── Read helpers ───────────────────────────────────────────────────────────────

export async function getGlobalNotifications(limit = 50) {
  return db
    .select()
    .from(notificationLogTable)
    .where(eq(notificationLogTable.recipientType, "all"))
    .orderBy(desc(notificationLogTable.createdAt))
    .limit(limit);
}

export async function getUserNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notificationLogTable)
    .where(
      or(
        eq(notificationLogTable.targetUserId, userId),
        eq(notificationLogTable.recipientType, "all"),
      ),
    )
    .orderBy(desc(notificationLogTable.createdAt))
    .limit(limit);
}
