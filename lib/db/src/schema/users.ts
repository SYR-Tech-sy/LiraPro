import { pgTable, text, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type UserRole = "user" | "vendor" | "admin";

export const usersTable = pgTable("users", {
  supabaseId: text("clerk_id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  fatherName: text("father_name"),
  phone: text("phone"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  role: text("role").notNull().default("user").$type<UserRole>(),
  governorate: text("governorate"),
  city: text("city"),
  address: text("address"),
  // Extended profile fields (full Supabase sync)
  profilePhoto: text("profile_photo"),
  loginProvider: text("login_provider").default("email"), // email | google | apple | github
  latitude: real("latitude"),
  longitude: real("longitude"),
  lastSeenAt: timestamp("last_seen_at"),
  isBanned: boolean("is_banned").notNull().default(false),
  bannedReason: text("banned_reason"),
  bannedUntil: timestamp("banned_until"),
  deletedAt: timestamp("deleted_at"),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
