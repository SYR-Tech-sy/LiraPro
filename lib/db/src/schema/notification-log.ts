import { pgTable, serial, bigint, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const notificationLogTable = pgTable("notification_log", {
  logId: serial("log_id").primaryKey(),
  notifId: bigint("notif_id", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  recipientType: varchar("recipient_type", { length: 20 }).notNull().default("all"),
  targetUserId: varchar("target_user_id", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  dedupHash: varchar("dedup_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
