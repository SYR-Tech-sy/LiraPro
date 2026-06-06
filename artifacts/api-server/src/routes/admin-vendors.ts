import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, vendorApplicationsTable, vendorPricesTable } from "@workspace/db";

const router: IRouter = Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "SYRSYP2026ADMIN";

function checkAdmin(req: import("express").Request, res: import("express").Response): boolean {
  const token = req.headers["x-admin-token"] as string;
  if (!token || token !== ADMIN_TOKEN) { res.status(403).json({ error: "Unauthorized" }); return false; }
  return true;
}

// ── Get vendor prices (admin view) ───────────────────────────────────────────
router.get("/admin/vendors/:vendorId/prices", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  try {
    const prices = await db.select().from(vendorPricesTable)
      .where(eq(vendorPricesTable.vendorSupabaseId, req.params.vendorId))
      .orderBy(desc(vendorPricesTable.updatedAt));
    res.json(prices);
  } catch (err) {
    req.log.error({ err }, "Failed to get vendor prices");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /admin/prices/:id — toggle isActive ────────────────────────────────
router.patch("/admin/prices/:id", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { isActive } = req.body as { isActive?: boolean };
    const [updated] = await db.update(vendorPricesTable)
      .set({ isActive: isActive ?? true, updatedAt: new Date() })
      .where(eq(vendorPricesTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update price");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /admin/prices/:id ─────────────────────────────────────────────────
router.delete("/admin/prices/:id", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    await db.delete(vendorPricesTable).where(eq(vendorPricesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete price");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── List all applications ─────────────────────────────────────────────────────
router.get("/admin/vendor-applications", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  try {
    const apps = await db.select().from(vendorApplicationsTable).orderBy(desc(vendorApplicationsTable.createdAt));
    res.json(apps);
  } catch (err) {
    req.log.error({ err }, "Failed to list applications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update application status ─────────────────────────────────────────────────
router.patch("/admin/vendor-applications/:id", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const body = req.body as { status: string; adminNotes?: string; reject_reason?: string };
    const notes = body.adminNotes ?? body.reject_reason ?? null;
    const [updated] = await db.update(vendorApplicationsTable)
      .set({ status: body.status as "pending" | "approved" | "rejected", adminNotes: notes, updatedAt: new Date() })
      .where(eq(vendorApplicationsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update application");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
