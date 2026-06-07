import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db, vendorApplicationsTable } from "@workspace/db";

const router: IRouter = Router();

const __dir = dirname(fileURLToPath(import.meta.url));
const NOTIFICATIONS_FILE = join(__dir, "../notifications.json");

interface Notification {
  id: number;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "price";
  icon: string;
  createdAt: string;
}

function readNotifications(): Notification[] {
  try {
    if (!existsSync(NOTIFICATIONS_FILE)) return [];
    return JSON.parse(readFileSync(NOTIFICATIONS_FILE, "utf-8")) as Notification[];
  } catch {
    return [];
  }
}

function _pushNotification(n: Omit<Notification, "id" | "createdAt">): void {
  const all = readNotifications();
  all.push({ ...n, id: Date.now(), createdAt: new Date().toISOString() });
  writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
}

// ── POST /applications/vendor ─────────────────────────────────────────────────
router.post("/applications/vendor", async (req, res): Promise<void> => {
  const body = req.body as {
    businessName: string;
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
    logoUrl?: string;
    category: string;
  };

  if (!body.businessName || !body.fullName || !body.email || !body.phone || !body.category) {
    res.status(400).json({ error: "businessName, fullName, email, phone, category are required" });
    return;
  }

  const [app] = await db.insert(vendorApplicationsTable).values({
    businessName: body.businessName,
    fullName: body.fullName,
    email: body.email,
    password: null,
    phone: body.phone,
    governorate: body.governorate ?? "",
    city: body.city ?? "",
    address: body.address ?? "",
    logoUrl: body.logoUrl ?? null,
    category: body.category,
  }).returning();

  req.log.info({ email: body.email }, "New vendor application submitted");
  res.status(201).json({ ok: true, id: app.id });
});

export default router;
