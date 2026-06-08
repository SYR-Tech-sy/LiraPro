/**
 * Price alert routes.
 *
 * POST /api/v2/alerts/check — called by the frontend after each rate refresh.
 * Evaluates all non-triggered alerts against the current rate map and emits
 * "alert" type notifications for users whose thresholds have been crossed.
 */
import { Router } from "express";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { emitNotification } from "../services/notificationService.js";

const router = Router();

// GET /api/v2/alerts
router.get("/v2/alerts", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const { data, error } = await supabaseAdmin!
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: "Failed to load alerts" }); return; }
  res.json(data ?? []);
});

// POST /api/v2/alerts
router.post("/v2/alerts", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const { code, name_ar, type, target_price } = req.body as {
    code: string; name_ar?: string; type: "buy" | "sell"; target_price: number;
  };

  if (!code || !type || target_price == null) {
    res.status(400).json({ error: "code, type, and target_price are required" });
    return;
  }

  const { data, error } = await supabaseAdmin!
    .from("price_alerts")
    .insert({ user_id: userId, code, name_ar: name_ar ?? null, type, target_price, is_triggered: false })
    .select()
    .single();

  if (error) { res.status(500).json({ error: "Failed to create alert" }); return; }
  res.status(201).json(data);
});

// DELETE /api/v2/alerts/:id
router.delete("/v2/alerts/:id", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const { error } = await supabaseAdmin!
    .from("price_alerts")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", userId);

  if (error) { res.status(500).json({ error: "Failed to delete alert" }); return; }
  res.json({ success: true });
});

// ── POST /api/v2/alerts/check ─────────────────────────────────────────────────
// Called by the frontend after each exchange-rate refresh.
// Body: { rates: Record<string, number> } — map of currency code → SYP rate.
// For each active (non-triggered) alert:
//   - "buy" alert: notify when rate <= target_price (good time to buy)
//   - "sell" alert: notify when rate >= target_price (good time to sell)
// Fires "alert" type notification (per user) and marks the alert as triggered.

router.post("/v2/alerts/check", requireSupabaseAuth, async (req, res): Promise<void> => {
  const userId = req.supabaseUserId!;
  const { rates } = req.body as { rates: Record<string, number> };

  if (!rates || typeof rates !== "object") {
    res.status(400).json({ error: "rates object required" });
    return;
  }

  try {
    const { data: alerts, error } = await supabaseAdmin!
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_triggered", false);

    if (error || !alerts) { res.json({ triggered: 0 }); return; }

    const triggered: string[] = [];

    for (const alert of alerts as Array<{
      id: string; code: string; name_ar?: string | null;
      type: "buy" | "sell"; target_price: number;
    }>) {
      const currentRate = rates[alert.code];
      if (currentRate == null) continue;

      const crossed =
        (alert.type === "buy" && currentRate <= alert.target_price) ||
        (alert.type === "sell" && currentRate >= alert.target_price);

      if (!crossed) continue;

      const currencyLabel = alert.name_ar ?? alert.code;
      const direction = alert.type === "buy" ? "الشراء" : "البيع";
      const title = `تنبيه سعر: ${currencyLabel}`;
      const body = `وصل سعر ${currencyLabel} إلى ${currentRate.toLocaleString("ar-SY")} ل.س — الهدف كان ${alert.target_price.toLocaleString("ar-SY")} ل.س للـ${direction}.`;

      // Emit alert notification (type: alert)
      void emitNotification({
        title,
        body,
        type: "alert",
        icon: "bell-ring",
        recipientType: "user",
        targetUserId: userId,
        actionUrl: "/app/rates",
      }).catch(() => {});

      triggered.push(alert.id);
    }

    // Mark triggered alerts so they don't fire again
    if (triggered.length > 0) {
      await supabaseAdmin!
        .from("price_alerts")
        .update({ is_triggered: true })
        .in("id", triggered);
    }

    res.json({ triggered: triggered.length });
  } catch {
    res.status(500).json({ error: "Failed to check alerts" });
  }
});

export default router;
