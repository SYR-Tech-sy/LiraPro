# LiraPro — منصة أسعار الصرف السورية

منصة مالية سورية متكاملة لمتابعة أسعار الصرف، الذهب، المعادن، والأسواق المحلية في سوريا.

## Run & Operate

- `pnpm --filter @workspace/syr-syp run dev` — تشغيل الواجهة (port 19371)
- `pnpm --filter @workspace/api-server run dev` — تشغيل الـ API server (port 8080)
- `pnpm run typecheck` — فحص TypeScript لكل المشروع
- `pnpm run build` — بناء كل المشروع
- `pnpm --filter @workspace/api-spec run codegen` — إعادة توليد API hooks وZod schemas
- `pnpm --filter @workspace/db run push` — رفع تغييرات الـ DB schema

## Stack

- pnpm workspaces، Node.js 24، TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + Framer Motion
- Backend: Express 5
- Auth: Supabase Auth (email/password + OAuth)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`)، `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/syr-syp/` — الواجهة الأمامية (React + Vite)
- `artifacts/api-server/` — الـ API backend (Express)
- `lib/db/` — قاعدة البيانات (Drizzle schema)
- `lib/api-spec/` — OpenAPI spec
- `lib/api-zod/` — Zod validation schemas (generated)
- `lib/api-client-react/` — React Query hooks (generated)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- Supabase Auth — session via `useAuth()` context, TOKEN_REFRESHED filtered to prevent tab-refocus reload
- Admin auth via `ADMIN_TOKEN` env var (default `SYRSYP2026ADMIN` — يجب تغييره)
- Rate overrides (SYP، ذهب، معادن) مخزّنة في جدول `rate_overrides` بقاعدة البيانات — تبقى بعد إعادة التشغيل
- Currency (forex) overrides مخزّنة في ملف JSON محلي (`rate-overrides.json`) — تبقى بعد إعادة التشغيل
- Metal prices via MetalPriceAPI, cached 8 hours

## Product

- أسعار صرف حية مقابل الليرة السورية
- أسعار الذهب والمعادن (MetalPriceAPI، cache 8h)
- محوّل عملات
- أسعار السوق المحلية من التجار المسجّلين
- نظام التجار (Vendor) مع شارة ذهبية (Legendary glow + Cyberpunk 6-ring)
- تنبيهات الأسعار، محفظة الممتلكات
- لوحة تحكم للمشرف
- دعم كامل للعربية مع RTL
- Dark mode كامل (primary: 162 75% 46% في dark، 162 100% 12% في light)

## Theming

- Light primary: `162 100% 12%` (dark forest green)
- Dark primary: `162 75% 46%` (bright emerald — مرئي في dark mode)
- لا تستخدم ألوان `#003C32` / `#005a4a` مباشرةً في UI — استخدم `bg-primary` / `text-primary`
- الاستثناء: ألوان البيانات (charts، category pills، user-type badges) — مقصودة

## User preferences

- اللغة العربية أساساً، دعم إنجليزي
- RTL layout
- أرقام عربية افتراضياً (قابل للتبديل من الإعدادات)

## Gotchas

- Supabase anon/service keys في secrets: `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `SESSION_SECRET` مطلوب للـ Express sessions
- إصلاح إعادة التحميل عند التبديل بين التبويبات: TOKEN_REFRESHED مُفلتر في auth-context

## Pointers

- See the `pnpm-workspace` skill for workspace structure details
