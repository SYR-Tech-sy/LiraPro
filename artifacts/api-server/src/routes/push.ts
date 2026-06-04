import { Router } from "express";
import webpush from "web-push";

const router = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ??
  "BJzyEc9S5BL2HQtaPDL0IzsaKrj9hsy2XoaS7VlVb47osz07-tZE-o-9hgtii2sVBMlYeKN0CHl9sPaxuYRptdc";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ??
  "HRgfhQngmEKy8v3iZxsBPxk9Lt5AMttrg-X5fqRpeyc";

webpush.setVapidDetails("mailto:admin@lirapro.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface StoredSub {
  endpoint: string;
  keys: { auth: string; p256dh: string };
}

let subscriptions: StoredSub[] = [];

// GET /api/push/vapid-public-key
router.get("/push/vapid-public-key", (_req, res): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post("/push/subscribe", (req, res): void => {
  const sub = req.body as StoredSub;
  if (!sub?.endpoint || !sub?.keys?.auth || !sub?.keys?.p256dh) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }
  if (!subscriptions.some((s) => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
  }
  res.json({ success: true, count: subscriptions.length });
});

// DELETE /api/push/subscribe
router.delete("/push/subscribe", (req, res): void => {
  const { endpoint } = req.body as { endpoint?: string };
  if (endpoint) subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  res.json({ success: true });
});

// GET /api/push/subscribers-count — admin only
router.get("/push/subscribers-count", (req, res): void => {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return; }
  res.json({ count: subscriptions.length });
});

export async function sendPushToAll(title: string, body: string, url = "/app/home"): Promise<void> {
  if (subscriptions.length === 0) return;
  const payload = JSON.stringify({ title, body, url });
  const failed: string[] = [];
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub as webpush.PushSubscription, payload);
      } catch {
        failed.push(sub.endpoint);
      }
    })
  );
  if (failed.length > 0) {
    subscriptions = subscriptions.filter((s) => !failed.includes(s.endpoint));
  }
}

export default router;
