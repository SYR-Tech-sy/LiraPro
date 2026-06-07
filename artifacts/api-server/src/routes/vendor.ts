import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, vendorProfilesTable, vendorPricesTable, usersTable } from "@workspace/db";
import { requireSupabaseAuth } from "../middlewares/requireSupabaseAuth.js";
import { updateVendorPriceSchema } from "@workspace/db";
import { supabaseAdmin } from "../lib/supabase-admin.js";

const router: IRouter = Router();

// ── Middleware: vendor-only ──────────────────────────────────────────────────
async function requireVendor(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
): Promise<void> {
  const userId = req.supabaseUserId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.supabaseId, userId));
    if (!user || (user.role !== "vendor" && user.role !== "admin")) {
      res.status(403).json({ error: "Forbidden: vendor access only" });
      return;
    }
    next();
  } catch (err) {
    req.log.error({ err }, "requireVendor DB error");
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET /vendor/profile ───────────────────────────────────────────────────────
router.get("/vendor/profile", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;

    // Primary: Drizzle vendor_profiles table
    const [profile] = await db.select().from(vendorProfilesTable).where(eq(vendorProfilesTable.supabaseId, userId));
    if (profile) { res.json(profile); return; }

    // Fallback: admin-created vendors stored in Supabase vendors table
    const { data: vendor } = await supabaseAdmin!
      .from("vendors")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (vendor) {
      const v = vendor as Record<string, unknown>;
      res.json({
        id: v.id,
        supabaseId: userId,
        businessName: v.business_name ?? "",
        fullName: v.owner_name ?? "",
        email: v.email ?? "",
        phone: v.phone ?? "",
        governorate: v.governorate ?? "",
        city: v.city ?? "",
        address: v.address ?? "",
        category: Array.isArray(v.category_ids) && (v.category_ids as string[]).length > 0
          ? (v.category_ids as string[])[0]
          : "local_market",
        trustScore: typeof v.trust_score === "number" ? v.trust_score * 10 : 50,
        isActive: v.is_active ?? true,
        logoUrl: v.logo_url ?? null,
      });
      return;
    }

    res.status(404).json({ error: "Vendor profile not found" });
  } catch (err) {
    req.log.error({ err }, "Failed to get vendor profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /vendor/link-by-email ────────────────────────────────────────────────
// Called on login: if the user's Supabase email matches an approved vendor profile,
// link their current userId to it and grant vendor role.
router.post("/vendor/link-by-email", requireSupabaseAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const email = req.supabaseUserEmail?.toLowerCase().trim();
    if (!email) { res.status(400).json({ error: "No email in session" }); return; }

    // Find a vendor profile by email (case-insensitive)
    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(sql`lower(${vendorProfilesTable.email}) = ${email}`);
    if (!profile) { res.status(404).json({ error: "No vendor profile for this email" }); return; }

    // Link this session's userId to the profile (idempotent)
    const [updated] = await db
      .update(vendorProfilesTable)
      .set({ supabaseId: userId })
      .where(eq(vendorProfilesTable.id, profile.id))
      .returning();

    // Upsert user row with vendor role
    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.supabaseId, userId));
    if (existingUser) {
      await db.update(usersTable).set({ role: "vendor", updatedAt: new Date() }).where(eq(usersTable.supabaseId, userId));
    } else {
      await db.insert(usersTable).values({ supabaseId: userId, email, role: "vendor", profileCompleted: false });
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to link vendor by email");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /vendor/prices ────────────────────────────────────────────────────────
router.get("/vendor/prices", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const prices = await db
      .select()
      .from(vendorPricesTable)
      .where(eq(vendorPricesTable.vendorSupabaseId, userId))
      .orderBy(desc(vendorPricesTable.updatedAt));
    res.json(prices);
  } catch (err) {
    req.log.error({ err }, "Failed to get vendor prices");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /vendor/prices ───────────────────────────────────────────────────────
router.post("/vendor/prices", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const [profile] = await db.select({ category: vendorProfilesTable.category, governorate: vendorProfilesTable.governorate, city: vendorProfilesTable.city })
      .from(vendorProfilesTable).where(eq(vendorProfilesTable.supabaseId, userId));
    if (!profile) { res.status(404).json({ error: "Vendor profile not found" }); return; }

    const body = req.body as Record<string, unknown>;
    if (!body.productNameAr || !body.price || !body.unit) {
      res.status(400).json({ error: "productNameAr, price, unit are required" });
      return;
    }

    const [newPrice] = await db.insert(vendorPricesTable).values({
      vendorSupabaseId: userId,
      category: (body.category as string) || profile.category,
      productName: (body.productName as string) || (body.productNameAr as string),
      productNameAr: body.productNameAr as string,
      price: Number(body.price),
      priceBuy: body.priceBuy ? Number(body.priceBuy) : null,
      priceSell: body.priceSell ? Number(body.priceSell) : null,
      unit: body.unit as string,
      currency: (body.currency as string) || "SYP",
      governorate: (body.governorate as string) || profile.governorate || null,
      city: (body.city as string) || profile.city || null,
      notes: (body.notes as string) || null,
      quantity: (body.quantity as string) || null,
    }).returning();

    res.status(201).json(newPrice);
  } catch (err) {
    req.log.error({ err }, "Failed to create vendor price");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /vendor/prices/:id ────────────────────────────────────────────────────
router.put("/vendor/prices/:id", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const id = Number(req.params.id);
    const parsed = updateVendorPriceSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

    const [existing] = await db.select({ vendorSupabaseId: vendorPricesTable.vendorSupabaseId })
      .from(vendorPricesTable).where(eq(vendorPricesTable.id, id));
    if (!existing || existing.vendorSupabaseId !== userId) {
      res.status(403).json({ error: "Not authorized to edit this price" });
      return;
    }

    const [updated] = await db
      .update(vendorPricesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(vendorPricesTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update vendor price");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /vendor/prices/:id ─────────────────────────────────────────────────
router.delete("/vendor/prices/:id", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const id = Number(req.params.id);
    const [existing] = await db.select({ vendorSupabaseId: vendorPricesTable.vendorSupabaseId })
      .from(vendorPricesTable).where(eq(vendorPricesTable.id, id));
    if (!existing || existing.vendorSupabaseId !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    await db.delete(vendorPricesTable).where(eq(vendorPricesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete vendor price");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /vendor/profile ───────────────────────────────────────────────────────
router.put("/vendor/profile", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const body = req.body as Partial<{
      businessName: string;
      phone: string;
      address: string;
      governorate: string;
      city: string;
      logoUrl: string;
    }>;
    type VPInsert = typeof vendorProfilesTable.$inferInsert;
    const patch: Partial<VPInsert> = { updatedAt: new Date() };
    if (body.businessName !== undefined) patch.businessName = body.businessName;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.address !== undefined) patch.address = body.address;
    if (body.governorate !== undefined) patch.governorate = body.governorate;
    if (body.city !== undefined) patch.city = body.city;
    if (body.logoUrl !== undefined) patch.logoUrl = body.logoUrl;

    const [updated] = await db.update(vendorProfilesTable)
      .set(patch)
      .where(eq(vendorProfilesTable.supabaseId, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "Vendor profile not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update vendor profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /vendor/stats ─────────────────────────────────────────────────────────
router.get("/vendor/stats", requireSupabaseAuth, requireVendor, async (req, res): Promise<void> => {
  try {
    const userId = req.supabaseUserId!;
    const [profile] = await db.select().from(vendorProfilesTable).where(eq(vendorProfilesTable.supabaseId, userId));
    const prices = await db.select({ views: vendorPricesTable.views, isActive: vendorPricesTable.isActive })
      .from(vendorPricesTable).where(eq(vendorPricesTable.vendorSupabaseId, userId));
    const totalViews = prices.reduce((s, p) => s + p.views, 0);
    const activePrices = prices.filter(p => p.isActive).length;
    res.json({
      trustScore: profile?.trustScore ?? 50,
      totalPrices: prices.length,
      activePrices,
      totalViews,
      businessName: profile?.businessName,
      category: profile?.category,
      governorate: profile?.governorate,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get vendor stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
