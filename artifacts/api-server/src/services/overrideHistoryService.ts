import { db, overrideHistoryTable } from "@workspace/db";
import { desc, lt } from "drizzle-orm";

export interface OverrideHistoryEntry {
  id: number;
  priceType: string;
  key: string;
  action: string;
  priceSYP: number | null;
  changedBy: string | null;
  changedAt: string;
}

export async function logOverrideHistory(
  priceType: string,
  key: string,
  action: "set" | "clear",
  priceSYP?: number | null,
  changedBy?: string | null,
): Promise<void> {
  await db.insert(overrideHistoryTable).values({
    priceType,
    key,
    action,
    priceSYP: priceSYP ?? null,
    changedBy: changedBy ?? null,
    changedAt: new Date(),
  });
}

export async function getOverrideHistory(limit = 50): Promise<OverrideHistoryEntry[]> {
  const rows = await db
    .select()
    .from(overrideHistoryTable)
    .orderBy(desc(overrideHistoryTable.changedAt))
    .limit(limit);
  return rows.map(r => ({
    id: r.id,
    priceType: r.priceType,
    key: r.key,
    action: r.action,
    priceSYP: r.priceSYP ?? null,
    changedBy: r.changedBy ?? null,
    changedAt: r.changedAt.toISOString(),
  }));
}

export async function clearOverrideHistory(olderThanDays?: number): Promise<number> {
  if (olderThanDays != null && olderThanDays > 0) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(overrideHistoryTable)
      .where(lt(overrideHistoryTable.changedAt, cutoff))
      .returning({ id: overrideHistoryTable.id });
    return result.length;
  }
  const result = await db
    .delete(overrideHistoryTable)
    .returning({ id: overrideHistoryTable.id });
  return result.length;
}

export async function pruneOldHistory(olderThanDays = 90): Promise<void> {
  await clearOverrideHistory(olderThanDays);
}
