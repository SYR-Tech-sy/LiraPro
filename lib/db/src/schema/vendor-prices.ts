import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vendorPricesTable = pgTable("vendor_prices", {
  id: serial("id").primaryKey(),
  vendorClerkId: text("vendor_clerk_id").notNull(),
  category: text("category").notNull(),
  productName: text("product_name").notNull(),
  productNameAr: text("product_name_ar").notNull(),
  price: real("price").notNull(),
  priceBuy: real("price_buy"),
  priceSell: real("price_sell"),
  unit: text("unit").notNull().default("وحدة"),
  currency: text("currency").notNull().default("SYP"),
  governorate: text("governorate"),
  city: text("city"),
  notes: text("notes"),
  quantity: text("quantity"),
  views: integer("views").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorPriceSchema = createInsertSchema(vendorPricesTable).omit({
  id: true,
  views: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVendorPriceSchema = z.object({
  productName: z.string().optional(),
  productNameAr: z.string().optional(),
  price: z.number().positive().optional(),
  priceBuy: z.number().positive().optional().nullable(),
  priceSell: z.number().positive().optional().nullable(),
  unit: z.string().optional(),
  notes: z.string().optional().nullable(),
  quantity: z.string().optional().nullable(),
  governorate: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type InsertVendorPrice = z.infer<typeof insertVendorPriceSchema>;
export type VendorPrice = typeof vendorPricesTable.$inferSelect;
