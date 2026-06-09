import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, Stethoscope, ShoppingCart, Zap, Smartphone, Building2, Shield, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useApp } from '@/context/app-context';
import { AnimatedLogo } from '@/components/animated-logo';

const SERVICES_LIST = [
  { icon: Stethoscope, titleAr: 'حجز المواعيد الطبية',     titleEn: 'Medical Appointments',   descAr: 'احجز مواعيدك في العيادات والمشافي بكل سهولة',            descEn: 'Book appointments at clinics and hospitals easily',      color: '#0284c7' },
  { icon: ShoppingCart, titleAr: 'التسوق الإلكتروني',       titleEn: 'Online Shopping',        descAr: 'تسوق من أفضل المتاجر المحلية وادفع بأمان',               descEn: 'Shop from local stores and pay securely',                color: '#D20073' },
  { icon: Zap,          titleAr: 'دفع الفواتير',             titleEn: 'Bill Payments',          descAr: 'ادفع فواتير الكهرباء والمياه والإنترنت بنقرة واحدة',     descEn: 'Pay electricity, water, and internet bills in one tap',  color: '#F97316' },
  { icon: Smartphone,   titleAr: 'خدمات الاتصالات',         titleEn: 'Telecom Services',       descAr: 'شحن الرصيد وشراء باقات الإنترنت بسرعة وسهولة',          descEn: 'Top up credit and buy data packages quickly',           color: '#16a34a' },
  { icon: Building2,    titleAr: 'خدمات مزودي الأعمال',     titleEn: 'Business Provider Services', descAr: 'إدارة متكاملة لمزودي الخدمات مع لوحة تحكم احترافية', descEn: 'Full management for service providers with pro dashboard', color: '#003C32' },
  { icon: Shield,       titleAr: 'دفع آمن ومشفر',           titleEn: 'Secure Payments',        descAr: 'جميع معاملاتك محمية بأعلى معايير التشفير والأمان',       descEn: 'All transactions secured with top encryption standards', color: '#7c3aed' },
];

export default function ServicesOnboardingPage() {
  const [, navigate] = useLocation();
  const { language } = useApp();
  const ar = language === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 pb-12"
    >
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => navigate('/app/home')}
          className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">
          {ar ? 'الخدمات والرصيد' : 'Services & Balance'}
        </h2>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #D20073, #ff3d8f)' }}
      >
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full opacity-20" style={{ background: '#fff' }} />
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="relative z-10 flex flex-col items-center gap-3 py-8 px-5 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div
            className="rounded-2xl px-4 py-1.5 flex items-center justify-center max-w-full overflow-hidden"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="overflow-hidden max-w-[180px]">
              <AnimatedLogo fontSize="1rem" color="#003C32" />
            </div>
          </div>
          <p className="font-black text-xl mt-1">
            {ar ? 'منصة الخدمات والرصيد' : 'Services & Balance Platform'}
          </p>
          <p className="text-xs text-white/80 leading-relaxed max-w-[260px]">
            {ar
              ? 'إدارة رصيدك بالليرة السورية والدولار واليورو، مع الوصول لمئات الخدمات المحلية'
              : 'Manage your balance in SYP, USD & EUR, with access to hundreds of local services'}
          </p>

          {/* Coming Soon badge */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-1 px-6 py-2.5 rounded-2xl font-black text-base flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.5)', color: '#fff' }}
          >
            <Clock className="w-4 h-4" />
            {ar ? 'قريباً' : 'Coming Soon'}
          </motion.div>
        </div>
      </motion.div>

      {/* Services list */}
      <h3 className="font-bold text-sm px-1">
        {ar ? 'ما الذي ستحصل عليه؟' : 'What will you get?'}
      </h3>

      <div className="flex flex-col gap-3">
        {SERVICES_LIST.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-start gap-3 p-4 rounded-2xl border"
              style={{ borderColor: item.color + '30', background: item.color + '08' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: item.color + '18' }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{ar ? item.titleAr : item.titleEn}</p>
                <p className="text-xs text-foreground/60 dark:text-white/60 leading-relaxed mt-0.5">
                  {ar ? item.descAr : item.descEn}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Coming Soon footer button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col gap-3 mt-2"
      >
        <div
          className="w-full h-13 rounded-2xl flex items-center justify-center gap-2 py-3.5 font-black text-base cursor-not-allowed select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(210,0,115,0.12), rgba(0,60,50,0.08))',
            border: '2px dashed rgba(210,0,115,0.4)',
            color: '#D20073',
          }}
        >
          <Clock className="w-5 h-5" />
          {ar ? 'قريباً — ترقّب الإطلاق!' : 'Coming Soon — Stay Tuned!'}
        </div>
        <p className="text-center text-xs text-foreground/50 dark:text-white/40">
          {ar
            ? 'سيتم الإعلان عن موعد الإطلاق قريباً. ترقّب التحديثات!'
            : 'Launch date will be announced soon. Stay tuned for updates!'}
        </p>
      </motion.div>
    </motion.div>
  );
}
