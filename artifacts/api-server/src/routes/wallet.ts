/**
 * POST /api/wallet/event — emit a wallet-type notification for a specific user.
 *
 * Called by the frontend (or other server-side code) when a wallet transaction
 * occurs (credit, debit, exchange, etc.).  Fires the "wallet" notification type
 * through the unified pipeline: DB log → SSE → push.
 *
 * Auth: requires the user's own Supabase JWT OR an admin token.
 */
import { Router } from "express";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import { emitNotification } from "../services/notificationService.js";

const router = Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "SYRSYP2026ADMIN";

router.post("/wallet/event", requireSupabaseAuth, async (req, res): Promise<void> => {
  const actorId = req.supabaseUserId!;
  const adminToken = req.headers["x-admin-token"] as string | undefined;
  const { targetUserId, title, body, actionUrl } = req.body as {
    targetUserId?: string; title: string; body: string; actionUrl?: string;
  };

  // Determine effective recipient:
  //   - Admin can send to any targetUserId
  //   - Regular user can only send to themselves
  const recipientId = (adminToken === ADMIN_TOKEN && targetUserId) ? targetUserId : actorId;

  if (!title || !body) {
    res.status(400).json({ error: "title and body required" });
    return;
  }

  const result = await emitNotification({
    title,
    body,
    type: "wallet",
    icon: "wallet",
    recipientType: "user",
    targetUserId: recipientId,
    actionUrl: actionUrl ?? "/app/portfolio",
  });

  if (result.deduplicated) {
    res.status(409).json({ error: "Duplicate wallet event within 60 seconds" });
    return;
  }

  res.json({ ok: true, notifId: result.notifId, sent: result.sent });
});

export default router;
