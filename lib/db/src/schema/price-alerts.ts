import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceAlertsTable = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  supabaseId: text("clerk_id").notNull(),
  code: text("code").notNull(),
  nameAr: text("name_ar"),
  type: text("type").notNull().$type<"buy" | "sell">(),
  targetPrice: real("target_price").notNull(),
  isTriggered: boolean("is_triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPriceAlertSchema = createInsertSchema(priceAlertsTable).omit({
  id: true,
  isTriggered: true,
  triggeredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePriceAlertSchema = z.object({
  type: z.enum(["buy", "sell"]).optional(),
  targetPrice: z.number().positive().optional(),
  nameAr: z.string().optional(),
});

export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceAlert = typeof priceAlertsTable.$inferSelect;
