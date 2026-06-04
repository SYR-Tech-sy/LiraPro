---
name: Supabase secrets setup
description: Which env vars are needed and how they flow into the app.
---

**Frontend (syr-syp):** vite.config.ts maps process.env.SUPABASE_URL → VITE_SUPABASE_URL and process.env.SUPABASE_ANON_KEY → VITE_SUPABASE_ANON_KEY. Both read by artifacts/syr-syp/src/lib/supabase.ts.

**Backend (api-server):** reads SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) directly from process.env.

**Secrets currently set:** SUPABASE_ANON_KEY (secret), SUPABASE_SERVICE_KEY (secret), OPENAI_API_KEY (secret). SUPABASE_URL is a shared env var.

**Why:** SUPABASE_ANON_KEY must be a secret (not env var) so it can be passed through Vite at build/dev time.
