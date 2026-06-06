---
name: Vendor role sync
description: Drizzle usersTable and Supabase profiles table are separate — both must be updated when approving vendors
---

The `requireVendor` middleware in `artifacts/api-server/src/routes/vendor.ts` checks `usersTable` (Drizzle, maps to `"users"` PostgreSQL table). The admin vendor approval flow in `supabase-vendors.ts` historically only updated `supabaseAdmin.from("profiles")` (Supabase API, different table).

**Why:** If only `profiles` is updated, `requireVendor` check fails and the vendor can never access `/vendor/profile` — sidebar never shows.

**How to apply:** When upgrading user to vendor role, always update BOTH:
1. `supabaseAdmin.from("profiles").update({ role: "vendor" }).eq("id", userId)`
2. `db.update(usersTable).set({ role: "vendor" }).where(eq(usersTable.clerkId, userId))` — or insert if row doesn't exist
