-- ══════════════════════════════════════════════════════════════════════════════
-- LiraPro — Complete Supabase Schema (idempotent — safe to run multiple times)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── DROP ALL POLICIES FIRST (so re-running never errors) ──────────────────────
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── 1. PROFILES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  father_name     TEXT,
  phone           TEXT,
  birth_date      DATE,
  gender          TEXT CHECK (gender IN ('male', 'female')),
  governorate     TEXT,
  city            TEXT,
  address         TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin', 'moderator')),
  account_type    TEXT NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'provider')),
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  login_provider  TEXT DEFAULT 'email',
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access on profiles" ON public.profiles USING (true) WITH CHECK (true);

-- ── 2. BANS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned          BOOLEAN NOT NULL DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  restricted      BOOLEAN NOT NULL DEFAULT false,
  restricted_until TIMESTAMPTZ,
  restrict_reason TEXT,
  soft_deleted    BOOLEAN NOT NULL DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  delete_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on bans" ON public.bans USING (true);

-- ── 3. USER SESSIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name     TEXT,
  device_type     TEXT,
  os              TEXT,
  browser         TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  country         TEXT,
  city            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_active_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions"   ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on sessions" ON public.user_sessions USING (true);

-- ── 4. NOTIFICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','price_alert','system','vendor')),
  read       BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications"      ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can mark own notifications read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on notifications"    ON public.notifications USING (true);

-- ── 5. ACTIVITY LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  meta        JSONB DEFAULT '{}',
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on activity" ON public.activity_logs USING (true);

-- ── 6. ADMIN LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details        TEXT,
  meta           JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on admin_logs" ON public.admin_logs USING (true);

-- ── 7. PRICE ALERTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  name_ar      TEXT,
  type         TEXT NOT NULL CHECK (type IN ('buy','sell')),
  target_price NUMERIC NOT NULL,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own alerts" ON public.price_alerts USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on alerts" ON public.price_alerts USING (true);

-- ── 8. WALLETS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL,
  amount        NUMERIC NOT NULL DEFAULT 0,
  label         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, currency_code)
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wallet" ON public.wallets USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on wallets" ON public.wallets USING (true);

-- ── 9. SAVED ITEMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type  TEXT NOT NULL,
  item_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved items" ON public.saved_items USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on saved"       ON public.saved_items USING (true);

-- ── 10. VENDORS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_id       TEXT UNIQUE,
  business_name   TEXT NOT NULL,
  owner_name      TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  email           TEXT,
  governorate     TEXT,
  city            TEXT,
  address         TEXT,
  description     TEXT,
  logo_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_golden       BOOLEAN NOT NULL DEFAULT false,
  badge_type      TEXT DEFAULT 'none' CHECK (badge_type IN ('none','golden','legendary','cyberpunk')),
  trust_score     INTEGER NOT NULL DEFAULT 5 CHECK (trust_score BETWEEN 1 AND 10),
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  category_ids    TEXT[] DEFAULT '{}',
  governorate_ids TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active vendors"  ON public.vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Vendor can manage own record"    ON public.vendors FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on vendors"   ON public.vendors USING (true);

-- ── 11. VENDOR PRICES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_prices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  item_name_en TEXT,
  unit        TEXT DEFAULT 'kg',
  buy_price   NUMERIC,
  sell_price  NUMERIC,
  notes       TEXT,
  governorate TEXT,
  city        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.vendor_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active prices"      ON public.vendor_prices FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access on vendor_prices" ON public.vendor_prices USING (true);

-- ── 12. VENDOR APPLICATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  governorate   TEXT,
  city          TEXT,
  address       TEXT,
  category      TEXT,
  description   TEXT,
  document_url  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','reviewing')),
  reject_reason TEXT,
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications"   ON public.vendor_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create applications"     ON public.vendor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access on applications" ON public.vendor_applications USING (true);

-- ── 13. VERIFICATION REQUESTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'identity' CHECK (type IN ('identity','business','vendor')),
  document_type TEXT,
  document_url  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason TEXT,
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own verification" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on verification" ON public.verification_requests USING (true);

-- ── 14. DELETE REQUESTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delete_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own delete requests"  ON public.delete_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin full access on delete_requests" ON public.delete_requests USING (true);

-- ── 15. REPORTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user','vendor','price','notification')),
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports"  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin full access on reports" ON public.reports USING (true);

-- ── 16. EXCHANGE RATES HISTORY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exchange_rates_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency_code TEXT NOT NULL,
  rate          NUMERIC NOT NULL,
  buy_rate      NUMERIC,
  sell_rate     NUMERIC,
  source        TEXT DEFAULT 'api',
  is_manual     BOOLEAN DEFAULT false,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exchange_rates_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view exchange rates" ON public.exchange_rates_history FOR SELECT USING (true);
CREATE POLICY "Admin full access on rates"    ON public.exchange_rates_history USING (true);

-- ── 17. METAL RATES HISTORY ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.metal_rates_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metal_symbol TEXT NOT NULL,
  price_usd    NUMERIC NOT NULL,
  price_syp    NUMERIC,
  weight_unit  TEXT DEFAULT 'oz',
  source       TEXT DEFAULT 'metalpriceapi',
  is_manual    BOOLEAN DEFAULT false,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.metal_rates_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view metal rates" ON public.metal_rates_history FOR SELECT USING (true);
CREATE POLICY "Admin full access on metals" ON public.metal_rates_history USING (true);

-- ── 18. MARKET CATEGORIES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.market_categories (
  id         TEXT PRIMARY KEY,
  name_ar    TEXT NOT NULL,
  name_en    TEXT,
  icon       TEXT,
  color      TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view categories"    ON public.market_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access on categories" ON public.market_categories USING (true);

-- ── 19. APP SETTINGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  value_json JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view app settings"  ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admin full access on settings" ON public.app_settings USING (true);

-- ── 20. SYP RATE OVERRIDES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.syp_rate_overrides (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_manual BOOLEAN NOT NULL DEFAULT false,
  buy_rate  NUMERIC,
  sell_rate NUMERIC,
  set_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.syp_rate_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view syp rates"    ON public.syp_rate_overrides FOR SELECT USING (true);
CREATE POLICY "Admin full access on syp_rates" ON public.syp_rate_overrides USING (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type  ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_governorate   ON public.profiles(governorate);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read     ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id  ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action   ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created     ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_prices_category ON public.vendor_prices(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_prices_vendor   ON public.vendor_prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_apps_status     ON public.vendor_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user      ON public.price_alerts(user_id, is_triggered);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_code    ON public.exchange_rates_history(currency_code, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metal_rates_symbol     ON public.metal_rates_history(metal_symbol, recorded_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at           BEFORE UPDATE ON public.profiles           FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER bans_updated_at               BEFORE UPDATE ON public.bans               FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER vendors_updated_at            BEFORE UPDATE ON public.vendors            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER vendor_prices_updated_at      BEFORE UPDATE ON public.vendor_prices      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER vendor_applications_updated_at BEFORE UPDATE ON public.vendor_applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER wallets_updated_at            BEFORE UPDATE ON public.wallets            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, account_type, profile_completed, login_provider, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.email,''), 'user', 'personal', false, COALESCE(NEW.raw_app_meta_data->>'provider','email'), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════════════════
-- REALTIME (safe — skips if already added)
-- ══════════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_applications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bans;               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delete_requests;    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_logs;         EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.market_categories (id, name_ar, name_en, sort_order) VALUES
  ('currency',     'العملات والصرافة',         'Currency Exchange',   1),
  ('gold',         'الذهب والمجوهرات',          'Gold & Jewelry',      2),
  ('fuel',         'المحروقات',                 'Fuel',                3),
  ('construction', 'مواد البناء',               'Construction',        4),
  ('agriculture',  'المحاصيل الزراعية',         'Agriculture',         5),
  ('vegetables',   'الخضار والفواكه',           'Vegetables & Fruits', 6),
  ('food',         'المواد الغذائية',           'Food',                7),
  ('feed',         'الأعلاف والثروة الحيوانية', 'Feed & Livestock',    8),
  ('meat',         'اللحوم',                    'Meat',                9),
  ('metals',       'المعادن',                   'Metals',             10),
  ('transport',    'النقل والشحن',              'Transport',          11),
  ('electronics',  'الأجهزة والإلكترونيات',    'Electronics',        12),
  ('local_market', 'الأسواق المحلية',           'Local Market',       13),
  ('crypto',       'الكريبتو والعملات الرقمية', 'Crypto',             14)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_settings (key, value, description) VALUES
  ('app_name',         'LiraPro',            'اسم التطبيق'),
  ('app_version',      'v3.0 Pro',           'إصدار التطبيق'),
  ('maintenance_mode', 'false',              'وضع الصيانة'),
  ('allow_signups',    'true',               'السماح بالتسجيل الجديد'),
  ('default_currency', 'SYP',               'العملة الافتراضية'),
  ('support_email',    'support@lirapro.sy', 'بريد الدعم')
ON CONFLICT (key) DO NOTHING;
