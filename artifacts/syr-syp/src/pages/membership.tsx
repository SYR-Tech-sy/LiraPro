import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  ChevronLeft, Star, TrendingUp, Users, Shield, CheckCircle, MapPin,
  Building2, Send, Loader2, BadgeCheck, ChevronDown,
  ArrowLeftRight, Gem, Zap, Hammer, Leaf, ShoppingCart, Package,
  Utensils, Wrench, Truck, Smartphone, Store, Bitcoin, Cog, Phone, Droplets,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GoldenBadge } from '@/components/golden-badge';

const CATEGORIES = [
  { id: 'currency',      label: 'العملات والصرافة',        icon: ArrowLeftRight, color: '#0284c7' },
  { id: 'gold',          label: 'الذهب والمجوهرات',         icon: Gem,            color: '#f59e0b' },
  { id: 'fuel',          label: 'المحروقات',                icon: Zap,            color: '#f97316' },
  { id: 'construction',  label: 'مواد البناء',              icon: Hammer,         color: '#78716c' },
  { id: 'agriculture',   label: 'المحاصيل الزراعية',        icon: Leaf,           color: '#22c55e' },
  { id: 'vegetables',    label: 'الخضار والفواكه',           icon: ShoppingCart,   color: '#84cc16' },
  { id: 'food',          label: 'المواد الغذائية',           icon: Package,        color: '#a855f7' },
  { id: 'feed',          label: 'الأعلاف والثروة الحيوانية', icon: Cog,            color: '#92400e' },
  { id: 'meat',          label: 'اللحوم',                   icon: Utensils,       color: '#ef4444' },
  { id: 'oils',          label: 'الزيوت',                   icon: Droplets,       color: '#a16207' },
  { id: 'metals',        label: 'المعادن',                  icon: Wrench,         color: '#6b7280' },
  { id: 'transport',     label: 'النقل والشحن',             icon: Truck,          color: '#0ea5e9' },
  { id: 'electronics',   label: 'الأجهزة والإلكترونيات',    icon: Smartphone,     color: '#8b5cf6' },
  { id: 'local_market',  label: 'الأسواق المحلية',          icon: Store,          color: '#D20073' },
  { id: 'crypto',        label: 'الكريبتو والعملات الرقمية', icon: Bitcoin,        color: '#f59e0b' },
];

const GOVERNORATES = [
  'إدلب','دمشق','ريف دمشق','حلب','حمص','حماة','اللاذقية',
  'طرطوس','دير الزور','الرقة','الحسكة','درعا','السويداء','القنيطرة',
];

const BENEFITS = [
  { icon: Building2, color: '#D20073', title: 'ظهور اسم نشاطك التجاري', desc: 'يظهر اسم شركتك أو نشاطك داخل المنصة بجانب كل سعر تُدخله' },
  { icon: TrendingUp, color: '#003C32', title: 'زيادة العملاء', desc: 'الوصول إلى آلاف المستخدمين يومياً الباحثين عن أفضل الأسعار' },
  { icon: Shield, color: '#0284c7', title: 'بناء الموثوقية', desc: 'كلما كانت أسعارك دقيقة وحقيقية، زادت موثوقيتك وانتشارك' },
  { icon: Star, color: '#f59e0b', title: 'دعاية مجانية', desc: 'ظهور اسمك ضمن مصادر الأسعار الموثوقة بلا تكلفة إضافية' },
  { icon: Users, color: '#8b5cf6', title: 'انتشار واسع', desc: 'كلما ارتفع تقييمك، كلما ظهرت في صدارة النتائج' },
  { icon: BadgeCheck, color: '#D20073', title: 'علامة التوثيق الذهبية', desc: 'تُمنح لأصحاب الأسعار الدقيقة وتُعزز ثقة العملاء بك' },
];

const DEMO_CATS = [
  { id: 'currency', label: 'صرافة', color: '#0284c7', icon: ArrowLeftRight },
  { id: 'gold',     label: 'ذهب',   color: '#f59e0b', icon: Gem },
  { id: 'fuel',     label: 'محروقات', color: '#ef4444', icon: Zap },
  { id: 'food',     label: 'غذاء',  color: '#22c55e', icon: Package },
];

function GoldenBadgeDemo() {
  const [catIdx, setCatIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setCatIdx(i => (i + 1) % DEMO_CATS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const cat = DEMO_CATS[catIdx]!;
  const CatIcon = cat.icon;

  return (
    <div className="flex flex-col items-center gap-3 py-3 w-full">
      <div className="relative overflow-hidden">
        <span className="text-xs text-white/60 font-bold relative z-10">مثال على عرض مصدر السعر</span>
        <span className="absolute inset-0 shimmer-text" aria-hidden="true" />
      </div>
      {/* Vendor card matching real SourceCard design */}
      <div className="bg-card/95 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl w-full max-w-xs shadow-xl overflow-hidden">
        <div className="flex gap-3 px-3 py-3">
          {/* Rank */}
          <div className="flex-shrink-0 w-4 flex items-start pt-1">
            <span className="text-xs font-black" style={{ color: '#f59e0b' }}>1</span>
          </div>
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-200/60 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)` }}>
            <CatIcon className="w-6 h-6" style={{ color: cat.color }} />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="font-black text-sm text-blue-600 dark:text-blue-400 truncate">LiraPro {cat.label}</p>
              <GoldenBadge size={18} />
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Phone className="w-2.5 h-2.5 text-primary flex-shrink-0" />
              <span className="text-[10px] font-bold text-primary" dir="ltr">+963 23 456 7890</span>
            </div>
            <div className="flex items-start gap-1 mb-1">
              <MapPin className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-muted-foreground">إدلب — إدلب</span>
            </div>
            {/* Category pill auto-cycle */}
            <motion.div
              key={catIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: cat.color + '18', color: cat.color }}
            >
              <CatIcon className="w-2.5 h-2.5" />
              {cat.label}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { GoldenBadge } from '@/components/golden-badge';

function GovernorateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-sm bg-background transition-all focus:outline-none ${
          open ? 'border-primary ring-2 ring-primary/20' : 'border-border'
        }`}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || 'اختر المحافظة'}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            style={{ transformOrigin: 'top' }}
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {GOVERNORATES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { onChange(g); setOpen(false); }}
                  className={`w-full text-right px-4 py-2 text-sm transition-colors hover:bg-secondary ${
                    value === g ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map(c => {
        const Icon = c.icon;
        const selected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition-all ${
              selected
                ? 'border-primary bg-primary/8 shadow-sm'
                : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/40'
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.color + (selected ? '25' : '15') }}
            >
              <Icon className="w-4 h-4" style={{ color: c.color }} />
            </div>
            <span className={`text-xs leading-tight ${selected ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function MembershipPage() {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [form, setForm] = useState({
    businessName: '', fullName: '', email: '', phone: '',
    governorate: '', city: '', address: '', category: '', logoUrl: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.fullName || !form.email || !form.phone || !form.category) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/applications/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSent(true); toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً'); }
      else toast.error('فشل الإرسال، حاول مرة أخرى');
    } catch { toast.error('تعذر الاتصال بالخادم'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col pb-24 min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60 px-4 py-3 flex items-center gap-3">
        <Link href="/app/home">
          <button type="button" className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </Link>
        <h1 className="text-base font-black">طلب عضوية الإعلان عن الأسعار</h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/75"
        >
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h2 className="text-xl font-black text-white flex items-center gap-2">انضم كمزود موثوق <GoldenBadge size={24} /></h2>
                <p className="text-white/70 text-xs text-center">على منصة LiraPro</p>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              هل تعمل في تجارة العملات، الذهب، المحروقات، أو غيرها؟<br />
              انضم إلى شبكة المورّدين الموثوقين وأعلن أسعارك لآلاف المستخدمين يومياً.
            </p>
            <GoldenBadgeDemo />
          </div>
        </motion.div>

        {/* Benefits */}
        <div>
          <h3 className="font-black text-sm mb-3 text-foreground/80">مميزات الانضمام</h3>
          <div className="grid grid-cols-1 gap-3">
            {BENEFITS.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: b.color + '18' }}>
                      <b.icon className="w-4.5 h-4.5" style={{ color: b.color, width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How trust works */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="p-4" style={{ background: 'linear-gradient(135deg, #f59e0b18, #d9770618)' }}>
            <div className="flex items-center gap-2 mb-3">
              <GoldenBadge size={20} />
              <h3 className="font-black text-sm">كيف تزداد موثوقيتك؟</h3>
            </div>
            {[
              { pct: '50%', label: 'عند الانضمام', color: '#94a3b8', gold: false },
              { pct: '65%', label: 'بعد أول 10 تحديثات دقيقة', color: '#f59e0b', gold: false },
              { pct: '80%', label: 'أسعار منتظمة ومتطابقة مع السوق', color: '#d97706', gold: false },
              { pct: '100%', label: 'موثوق بالكامل — أولوية الظهور', color: '#f59e0b', gold: true },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${step.gold ? 'ring-2 ring-amber-400/60' : ''}`}
                  style={step.gold
                    ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)', color: 'white', boxShadow: '0 0 12px rgba(245,158,11,0.45)' }
                    : { background: step.color + '22', color: step.color }
                  }>
                  {step.pct}
                </div>
                <p className={`text-xs ${step.gold ? 'font-black text-amber-700 dark:text-amber-400' : 'text-foreground/80'}`}>{step.label}</p>
                {step.gold && <span className="text-amber-500 text-sm">✨</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        {!showForm && !sent && (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-13 text-base font-black gap-2 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #D20073, #a8005a)', boxShadow: '0 4px 20px rgba(210,0,115,0.35)' }}
            >
              <Send className="w-5 h-5" />
              تواصل معنا لطلب العضوية
            </Button>
          </motion.div>
        )}

        {/* Form */}
        <AnimatePresence>
          {showForm && !sent && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2"
                  style={{ background: '#D2007310' }}>
                  <Send className="w-4 h-4 text-pink-600" />
                  <h3 className="font-black text-sm">نموذج طلب العضوية</h3>
                </div>
                <form onSubmit={handleSubmit}>
                  <CardContent className="p-4 flex flex-col gap-3">

                    {/* Text fields */}
                    {[
                      { label: 'اسم النشاط التجاري أو الشركة *', key: 'businessName', type: 'text', ph: 'مثال: صرافة النور' },
                      { label: 'الاسم الثلاثي *', key: 'fullName', type: 'text', ph: 'الاسم الكامل' },
                      { label: 'البريد الإلكتروني *', key: 'email', type: 'email', ph: 'example@email.com' },
                      { label: 'رقم الهاتف *', key: 'phone', type: 'tel', ph: '+963 9XX XXX XXXX' },
                    ].map(f => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-foreground/70">{f.label}</label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={set(f.key as keyof typeof form)}
                          placeholder={f.ph}
                          dir={f.type === 'email' || f.type === 'tel' ? 'ltr' : 'rtl'}
                          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}

                    {/* Governorate — custom dropdown */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-foreground/70">المحافظة</label>
                      <GovernorateSelect
                        value={form.governorate}
                        onChange={v => setForm(f => ({ ...f, governorate: v }))}
                      />
                    </div>

                    {/* City — text input after governorate */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-foreground/70">المدينة / الحي</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={set('city')}
                        placeholder="مثال: دمشق — المزة"
                        dir="rtl"
                        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Address & Logo */}
                    {[
                      { label: 'العنوان الكامل مع رقم البناء', key: 'address', type: 'text', ph: 'الشارع، رقم البناء' },
                      { label: 'رابط الشعار (اختياري)', key: 'logoUrl', type: 'url', ph: 'https://...' },
                    ].map(f => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-foreground/70">{f.label}</label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={set(f.key as keyof typeof form)}
                          placeholder={f.ph}
                          dir={f.type === 'url' ? 'ltr' : 'rtl'}
                          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}

                    {/* Category — card grid */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/70">الفئة الرئيسية للنشاط *</label>
                      <CategoryGrid
                        value={form.category}
                        onChange={v => setForm(f => ({ ...f, category: v }))}
                      />
                      {!form.category && (
                        <p className="text-[11px] text-muted-foreground pr-1">اختر فئة نشاطك التجاري</p>
                      )}
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-foreground/70 leading-relaxed">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={e => setPrivacyAccepted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0 rounded"
                      />
                      <span>
                        أوافق على{' '}
                        <Link href="/app/privacy?vendor=1" className="text-primary font-bold underline underline-offset-2">
                          سياسة الخصوصية وشروط الاستخدام
                        </Link>
                        {' '}الخاصة بمنصة LiraPro
                      </span>
                    </label>

                    <Button type="submit" disabled={sending || !privacyAccepted}
                      className="w-full h-12 text-sm font-black gap-2 rounded-2xl mt-1"
                      style={{ background: 'linear-gradient(135deg, #D20073, #a8005a)', opacity: !privacyAccepted ? 0.5 : 1 }}>
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</> : <><Send className="w-4 h-4" /> إرسال الطلب</>}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </motion.div>
          )}

          {sent && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Card className="border-none shadow-lg overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </motion.div>
                  <h3 className="font-black text-lg">تم إرسال طلبك بنجاح!</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    سيقوم فريقنا بمراجعة طلبك والتواصل معك في أقرب وقت ممكن.<br />
                    شكراً لاهتمامك بالانضمام إلى LiraPro.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
