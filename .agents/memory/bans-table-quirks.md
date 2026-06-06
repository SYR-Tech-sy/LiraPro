---
name: Bans table quirks
description: Supabase bans table constraints and vendor creation field naming
---

## Unban endpoint
- Use `.update().eq("user_id", userId)` only — do NOT upsert with null values
- `ban_reason` is NOT NULL — use empty string `""` not null
- `banned_at` — omit entirely when unbanning (don't set to null)
- Upsert with `onConflict: "user_id"` fails when user doesn't exist in auth.users (FK constraint)

**Why:** Original upsert with `ban_reason: null, banned_at: null` threw 500 for all unban attempts.

## Vendor creation (saveVendor in admin.tsx)
- Backend (`/api/admin/vendors`) expects snake_case: `business_name`, `owner_name`, `user_id`, `trust_score`, `category_ids` (array)
- Frontend form uses camelCase: `businessName`, `fullName`, `clerkId`, `trustScore`, `category` (string)
- `trust_score` Supabase constraint: must be 0-10 (not 0-100). Normalize: `Math.min(10, Math.max(1, Math.round(score / 10)))`
- `category_ids` must be an array: `[category]`
