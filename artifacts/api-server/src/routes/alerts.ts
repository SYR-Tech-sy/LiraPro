import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { priceAlertsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";

const router: IRouter = Router();

// GET /api/alerts
router.get("/alerts", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const alerts = await db
      .select()
      .from(priceAlertsTable)
      .where(eq(priceAlertsTable.supabaseId, userId))
      .orderBy(priceAlertsTable.createdAt);
    res.json(alerts.reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to get alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/alerts
router.post("/alerts", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const { code, nameAr, type, targetPrice } = req.body as {
      code: string;
      nameAr?: string;
      type: "buy" | "sell";
      targetPrice: number;
    };

    if (!code || !type || targetPrice == null) {
      res.status(400).json({ error: "code, type, and targetPrice are required" });
      return;
    }

    const [created] = await db
      .insert(priceAlertsTable)
      .values({
        supabaseId: userId,
        code,
        nameAr: nameAr ?? null,
        type,
        targetPrice,
      })
      .returning();

    req.log.info({ id: created!.id }, "Alert created");
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create alert");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/alerts/:id
router.put("/alerts/:id", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const id = parseInt(String(req.params.id ?? "0"));
    const { type, targetPrice, nameAr } = req.body as {
      type?: "buy" | "sell";
      targetPrice?: number;
      nameAr?: string;
    };

    const existing = await db
      .select()
      .from(priceAlertsTable)
      .where(and(eq(priceAlertsTable.id, id), eq(priceAlertsTable.supabaseId, userId)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    const updates: Partial<typeof priceAlertsTable.$inferSelect> = {
      updatedAt: new Date(),
      isTriggered: false,
      triggeredAt: null,
    };
    if (type !== undefined) updates.type = type;
    if (targetPrice !== undefined) updates.targetPrice = targetPrice;
    if (nameAr !== undefined) updates.nameAr = nameAr;

    const [updated] = await db
      .update(priceAlertsTable)
      .set(updates)
      .where(and(eq(priceAlertsTable.id, id), eq(priceAlertsTable.supabaseId, userId)))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update alert");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/alerts/:id
router.delete("/alerts/:id", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const id = parseInt(String(req.params.id ?? "0"));

    const existing = await db
      .select()
      .from(priceAlertsTable)
      .where(and(eq(priceAlertsTable.id, id), eq(priceAlertsTable.supabaseId, userId)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    await db
      .delete(priceAlertsTable)
      .where(and(eq(priceAlertsTable.id, id), eq(priceAlertsTable.supabaseId, userId)));

    req.log.info({ id }, "Alert deleted");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete alert");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/alerts/check — check current rates against user's pending alerts
router.post("/alerts/check", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const { rates } = req.body as { rates: Record<string, number> };
    if (!rates || typeof rates !== "object") {
      res.status(400).json({ error: "rates object is required" });
      return;
    }

    const pending = await db
      .select()
      .from(priceAlertsTable)
      .where(and(
        eq(priceAlertsTable.supabaseId, userId),
        eq(priceAlertsTable.isTriggered, false),
      ));

    const triggered: typeof pending = [];

    for (const alert of pending) {
      const currentRate = rates[alert.code];
      if (currentRate == null) continue;

      const shouldTrigger =
        (alert.type === "buy" && currentRate <= alert.targetPrice) ||
        (alert.type === "sell" && currentRate >= alert.targetPrice);

      if (shouldTrigger) {
        const [updated] = await db
          .update(priceAlertsTable)
          .set({ isTriggered: true, triggeredAt: new Date(), updatedAt: new Date() })
          .where(eq(priceAlertsTable.id, alert.id))
          .returning();
        if (updated) triggered.push(updated);
      }
    }

    req.log.info({ count: triggered.length }, "Alerts checked");
    res.json(triggered);
  } catch (err) {
    req.log.error({ err }, "Failed to check alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
