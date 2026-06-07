import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, vendorPricesTable, vendorProfilesTable, type VendorCategory } from "@workspace/db";

const router: IRouter = Router();

interface AggregatedPrice {
  productNameAr: string;
  productName: string;
  category: string;
  unit: string;
  currency: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  weightedAvg: number;
  sourceCount: number;
  governorate: string | null;
  sources: Array<{
    businessName: string;
    phone: string;
    address: string;
    logoUrl: string | null;
    price: number;
    priceBuy: number | null;
    priceSell: number | null;
    trustScore: number;
    governorate: string | null;
    city: string | null;
    notes: string | null;
    updatedAt: Date;
  }>;
}

// ── GET /market/prices ────────────────────────────────────────────────────────
// ?category=fuel&governorate=دمشق
router.get("/market/prices", async (req, res): Promise<void> => {
  try {
  const { category, governorate } = req.query as { category?: string; governorate?: string };

  // Fetch active prices joined with vendor profile
  const rows = await db
    .select({
      priceId: vendorPricesTable.id,
      vendorSupabaseId: vendorPricesTable.vendorSupabaseId,
      category: vendorPricesTable.category,
      productName: vendorPricesTable.productName,
      productNameAr: vendorPricesTable.productNameAr,
      price: vendorPricesTable.price,
      priceBuy: vendorPricesTable.priceBuy,
      priceSell: vendorPricesTable.priceSell,
      unit: vendorPricesTable.unit,
      currency: vendorPricesTable.currency,
      notes: vendorPricesTable.notes,
      priceGovernorate: vendorPricesTable.governorate,
      city: vendorPricesTable.city,
      updatedAt: vendorPricesTable.updatedAt,
      businessName: vendorProfilesTable.businessName,
      phone: vendorProfilesTable.phone,
      address: vendorProfilesTable.address,
      logoUrl: vendorProfilesTable.logoUrl,
      trustScore: vendorProfilesTable.trustScore,
      vendorGovernorate: vendorProfilesTable.governorate,
      isVendorActive: vendorProfilesTable.isActive,
    })
    .from(vendorPricesTable)
    .innerJoin(vendorProfilesTable, eq(vendorPricesTable.vendorSupabaseId, vendorProfilesTable.supabaseId))
    .where(
      and(
        eq(vendorPricesTable.isActive, true),
        eq(vendorProfilesTable.isActive, true),
        category ? eq(vendorPricesTable.category, category) : undefined,
        governorate
          ? eq(vendorProfilesTable.governorate, governorate)
          : undefined,
      )
    )
    .orderBy(desc(vendorProfilesTable.trustScore));

  // Group by productNameAr + category + unit
  const grouped = new Map<string, AggregatedPrice>();

  for (const row of rows) {
    const key = `${row.category}::${row.productNameAr}::${row.unit}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        productNameAr: row.productNameAr,
        productName: row.productName,
        category: row.category,
        unit: row.unit,
        currency: row.currency,
        avgPrice: 0,
        minPrice: Infinity,
        maxPrice: -Infinity,
        weightedAvg: 0,
        sourceCount: 0,
        governorate: governorate ?? null,
        sources: [],
      });
    }
    const entry = grouped.get(key)!;
    entry.sources.push({
      businessName: row.businessName,
      phone: row.phone,
      address: row.address,
      logoUrl: row.logoUrl,
      price: row.price,
      priceBuy: row.priceBuy,
      priceSell: row.priceSell,
      trustScore: row.trustScore,
      governorate: row.priceGovernorate ?? row.vendorGovernorate,
      city: row.city,
      notes: row.notes,
      updatedAt: row.updatedAt,
    });
    if (row.price < entry.minPrice) entry.minPrice = row.price;
    if (row.price > entry.maxPrice) entry.maxPrice = row.price;
  }

  // Compute averages with anomaly exclusion (IQR method)
  for (const entry of grouped.values()) {
    if (entry.sources.length === 0) continue;

    // IQR-based outlier removal (only when we have 4+ sources)
    let activeSources = entry.sources;
    if (entry.sources.length >= 4) {
      const sorted = [...entry.sources].sort((a, b) => a.price - b.price);
      const q1 = sorted[Math.floor(sorted.length * 0.25)].price;
      const q3 = sorted[Math.floor(sorted.length * 0.75)].price;
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      const filtered = entry.sources.filter(s => s.price >= lower && s.price <= upper);
      if (filtered.length > 0) activeSources = filtered;
    }

    const total = activeSources.reduce((s, src) => s + src.price, 0);
    entry.avgPrice = total / activeSources.length;

    // Weighted average: weight = trustScore / 100
    let weightedSum = 0;
    let weightTotal = 0;
    for (const src of activeSources) {
      const w = src.trustScore / 100;
      weightedSum += src.price * w;
      weightTotal += w;
    }
    entry.weightedAvg = weightTotal > 0 ? weightedSum / weightTotal : entry.avgPrice;
    entry.sourceCount = activeSources.length;
    entry.minPrice = Math.min(...activeSources.map(s => s.price));
    entry.maxPrice = Math.max(...activeSources.map(s => s.price));
    if (!isFinite(entry.minPrice)) entry.minPrice = entry.avgPrice;
    if (!isFinite(entry.maxPrice)) entry.maxPrice = entry.avgPrice;
  }

  res.json(Array.from(grouped.values()));
  } catch (err) {
    req.log.error({ err }, "Failed to get market prices");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /market/vendors ───────────────────────────────────────────────────────
// Public list of active vendors (for display on pages)
router.get("/market/vendors", async (req, res): Promise<void> => {
  try {
    const { category, governorate } = req.query as { category?: string; governorate?: string };
    const vendors = await db.select({
      id: vendorProfilesTable.id,
      businessName: vendorProfilesTable.businessName,
      category: vendorProfilesTable.category,
      governorate: vendorProfilesTable.governorate,
      city: vendorProfilesTable.city,
      logoUrl: vendorProfilesTable.logoUrl,
      trustScore: vendorProfilesTable.trustScore,
    })
    .from(vendorProfilesTable)
    .where(
      and(
        eq(vendorProfilesTable.isActive, true),
        category ? eq(vendorProfilesTable.category, category as VendorCategory) : undefined,
        governorate ? eq(vendorProfilesTable.governorate, governorate) : undefined,
      )
    )
    .orderBy(desc(vendorProfilesTable.trustScore));
    res.json(vendors);
  } catch (err) {
    req.log.error({ err }, "Failed to get market vendors");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
