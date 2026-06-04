---
name: Clerk removal
description: Clerk was fully replaced with Supabase auth across frontend and backend.
---

**Rule:** All Clerk SDK imports (@clerk/express, @clerk/shared, @clerk/react, @clerk/themes, @clerk/localizations) have been removed. requireAuth middleware now calls verifySupabaseToken(). req.clerkUserId is gone — use req.supabaseUserId.

**Why:** User requested Clerk removal; frontend was already 100% Supabase.

**How to apply:** When adding new protected routes, always import requireAuth from "../middlewares/requireAuth" and use req.supabaseUserId. Never re-add @clerk packages.

The DB column named "clerkId" in usersTable/priceAlertsTable is just a legacy column name — it stores the Supabase user UUID now. This is fine; do not rename it without a migration.
