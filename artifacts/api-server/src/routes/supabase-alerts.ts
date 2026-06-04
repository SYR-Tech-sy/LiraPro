import { Router } from "express";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";

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

export default router;
