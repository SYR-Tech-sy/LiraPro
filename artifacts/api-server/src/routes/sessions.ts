import { Router } from "express";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import {
  getUserSessions,
  deleteSession,
  deleteAllOtherSessions,
  makeSessionId,
  trackSession,
} from "../services/sessionService.js";

const router = Router();

// GET /api/sessions — return all sessions for the current user
router.get("/sessions", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const ua = req.headers["user-agent"] ?? "";
  const currentId = makeSessionId(userId, ua);
  const sessions = await getUserSessions(userId);
  res.json(
    sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentId,
    })),
  );
});

// PUT /api/sessions/heartbeat — update lastSeenAt for the current session (called every 5 min)
router.put("/sessions/heartbeat", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const ip =
    ((req.headers["x-forwarded-for"] as string | undefined) ?? req.socket.remoteAddress ?? "")
      .split(",")[0]
      ?.trim() ?? "";
  const ua = (req.headers["user-agent"] as string | undefined) ?? "";
  await trackSession(userId, ip, ua);
  res.json({ ok: true });
});

// DELETE /api/sessions/:sessionId — revoke a specific session
router.delete("/sessions/:sessionId", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const { sessionId } = req.params as { sessionId: string };

  const sessions = await getUserSessions(userId);
  const owns = sessions.some((s) => s.id === sessionId);
  if (!owns) {
    res.status(403).json({ error: "Not your session" });
    return;
  }

  await deleteSession(sessionId);
  res.json({ success: true });
});

// DELETE /api/sessions — revoke all other sessions (keep current)
router.delete("/sessions", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const ua = req.headers["user-agent"] ?? "";
  const currentId = makeSessionId(userId, ua);
  await deleteAllOtherSessions(userId, currentId);
  res.json({ success: true });
});

export default router;
