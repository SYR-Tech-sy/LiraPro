import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Globe, Zap, Shield, TrendingUp, Bell, Wallet, Bitcoin, ArrowLeftRight, Map, CreditCard, Store } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/app-context';
import { AnimatedLogo } from '@/components/animated-logo';

type Feature = { icon: React.ElementType; titleKey: string; descKey: string; color: string; comingSoon?: boolean };
const FEATURES: Feature[] = [
  { icon: TrendingUp,    titleKey: 'featureLiveRates',    descKey: 'featureLiveRatesDesc',    color: '#003C32' },
  { icon: Star,          titleKey: 'featureGold',         descKey: 'featureGoldDesc',         color: '#D4AF37' },
  { icon: Globe,         titleKey: 'featureMetals',       descKey: 'featureMetalsDesc',       color: '#0284c7' },
  { icon: Bitcoin,       titleKey: 'featureCrypto',       descKey: 'featureCryptoDesc',       color: '#F97316' },
  { icon: Bell,          titleKey: 'featureAlerts',       descKey: 'featureAlertsDesc',       color: '#D20073' },
  { icon: Wallet,        titleKey: 'featureWallet',       descKey: 'featureWalletDesc',       color: '#16a34a' },
  { icon: ArrowLeftRight,titleKey: 'featureConverter',    descKey: 'featureConverterDesc',    color: '#7c3aed' },
  { icon: Map,           titleKey: 'featureGeo',          descKey: 'featureGeoDesc',          color: '#16a34a' },
  { icon: Zap,           titleKey: 'featureSpeed',        descKey: 'featureSpeedDesc',        color: '#7c3aed' },
  { icon: Shield,        titleKey: 'featureSecurity',     descKey: 'featureSecurityDesc',     color: '#059669' },
  { icon: CreditCard,    titleKey: 'featureServices',     descKey: 'featureServicesDesc',     color: '#D20073', comingSoon: true },
  { icon: Store,         titleKey: 'featureVendors',      descKey: 'featureVendorsDesc',      color: '#f59e0b' },
];

const FEATURE_TRANSLATIONS: Record<string, Record<'ar'|'en', string>> = {
  featureLiveRates:       { ar: 'أسعار صرف حية',           en: 'Live Exchange Rates' },
  featureLiveRatesDesc:   { ar: 'أسعار الصرف مقابل الليرة السورية لأكثر من 100 عملة عالمية بالسعر السوقي الحقيقي', en: 'Exchange rates vs Syrian Pound for 100+ currencies at real market price' },
  featureGold:            { ar: 'أسعار الذهب',              en: 'Gold Prices' },
  featureGoldDesc:        { ar: 'أسعار الذهب بجميع العيارات (14، 18، 21، 22، 24) بالغرام والأوقية', en: 'Gold prices for all karats (14, 18, 21, 22, 24) per gram and ounce' },
  featureMetals:          { ar: 'المعادن الثمينة',          en: 'Precious Metals' },
  featureMetalsDesc:      { ar: 'أسعار الذهب والفضة والبلاتين والبلاديوم والنحاس في الوقت الفعلي', en: 'Live prices for gold, silver, platinum, palladium, and copper' },
  featureCrypto:          { ar: 'العملات المشفرة',          en: 'Cryptocurrencies' },
  featureCryptoDesc:      { ar: 'أسعار أهم العملات المشفرة مع رسوم بيانية للأداء الأسبوعي', en: 'Top crypto prices with weekly performance charts' },
  featureAlerts:          { ar: 'تنبيهات الأسعار',         en: 'Price Alerts' },
  featureAlertsDesc:      { ar: 'أضبط تنبيهات سعر الشراء أو البيع لأي عملة أو معدن تختاره', en: 'Set buy or sell price alerts for any currency or metal' },
  featureWallet:          { ar: 'المحفظة الشخصية',          en: 'Personal Wallet' },
  featureWalletDesc:      { ar: 'تتبع ممتلكاتك من العملات والذهب والمشفرة مع حساب القيمة الإجمالية', en: 'Track your currency, gold, and crypto holdings with total value calculation' },
  featureConverter:       { ar: 'محوّل العملات',            en: 'Currency Converter' },
  featureConverterDesc:   { ar: 'حوّل بين أي عملتين بسرعة مع أسعار الشراء والبيع المحدّثة', en: 'Convert between any two currencies with updated buy/sell rates' },
  featureGeo:             { ar: 'تغطية سورية شاملة',        en: 'Full Syrian Coverage' },
  featureGeoDesc:         { ar: 'بيانات جغرافية لجميع المحافظات والمدن والبلدات والقرى السورية الـ 14', en: 'Geographic data for all 14 Syrian provinces, cities, towns, and villages' },
  featureSpeed:           { ar: 'سريع وخفيف',              en: 'Fast & Lightweight' },
  featureSpeedDesc:       { ar: 'تصميم RTL عربي احترافي مع أرقام عربية ووضع ليلي وتحميل سريع', en: 'Professional Arabic RTL with Arabic numerals, dark mode, and fast loading' },
  featureSecurity:        { ar: 'آمن وخاص',                en: 'Safe & Private' },
  featureSecurityDesc:    { ar: 'بياناتك الشخصية محمية ومشفرة. ممتلكاتك وتنبيهاتك مخزنة محلياً على جهازك', en: 'Your data is protected. Holdings and alerts stored locally on your device' },
  featureServices:        { ar: 'الخدمات والرصيد',         en: 'Services & Balance' },
  featureServicesDesc:    { ar: 'دفع الفواتير، التسوق، خدمات مزودي الأعمال وجميع الخدمات المحلية', en: 'Bill payments, shopping, business providers & all local services' },
  featureVendors:         { ar: 'الأسعار المحلية',          en: 'Local Market Prices' },
  featureVendorsDesc:     { ar: 'تصفح أسعار التجار المحليين الموثوقين لمختلف البضائع والمنتجات في محافظتك', en: 'Browse verified local trader prices for goods and products in your area' },
};

export default function AboutPage() {
  const [, navigate] = useLocation();
  const { t, language } = useApp();
  const lang = language as 'ar' | 'en';

  const ft = (key: string) => FEATURE_TRANSLATIONS[key]?.[lang] ?? key;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 pb-10">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/app/home')} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">{t('aboutApp')}</h2>
      </div>

      {/* Brand header with AnimatedLogo */}
      <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md overflow-hidden">
        <CardContent className="p-5 flex flex-col items-center text-center gap-3">
          <div className="py-2">
            <AnimatedLogo color="#ffffff" />
          </div>
          <p className="text-primary-foreground/80 text-xs">
            {language === 'ar'
              ? 'منصتك لمتابعة أسعار الصرف والذهب والأسواق المالية التجارية بكل الفئات وتصفح الخدمات المحلية في منطقتك'
              : 'Smart platform for Syrian exchange rates, gold & financial market tracking'}
          </p>
          <div className="flex gap-3 text-[10px] text-primary-foreground/60">
            <span>{t('version')} 1.0.0</span>
            <span>•</span>
            <span>2026</span>
            <span>•</span>
            <span>{language === 'ar' ? 'RTL عربي' : 'Arabic RTL'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-2">{t('aboutUs')}</h3>
          {language === 'ar' ? (
            <>
              <p className="text-xs text-foreground/70 dark:text-white leading-relaxed">
                LiraPro منصة متكاملة تجمع بين متابعة أسعار الصرف السورية وأسعار الذهب والمعادن والعملات المشفرة في الوقت الفعلي، مع نظام تجار موثوق يربط المستخدمين بمزودي الأسعار المحليين. صُمّمت لتلبية احتياجات المواطن السوري بواجهة عربية احترافية ودعم كامل لنظام RTL.
              </p>
              <p className="text-xs text-foreground/70 dark:text-white leading-relaxed mt-2">
                تعتمد المنصة على أحدث بيانات الأسواق العالمية مع تطبيق سعر الصرف السوقي الحقيقي للليرة السورية.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-foreground/70 dark:text-white leading-relaxed">
                LiraPro is an all-in-one platform combining real-time Syrian exchange rates, gold, metals and crypto tracking with a trusted local vendor system connecting users to verified price providers. Built for Syrians with a professional Arabic RTL interface.
              </p>
              <p className="text-xs text-foreground/70 dark:text-white leading-relaxed mt-2">
                The platform relies on the latest global market data using the real market exchange rate for the Syrian Pound.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <h3 className="font-bold text-sm px-1">{t('keyFeatures')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}>
              <Card className="border-border shadow-sm h-full overflow-hidden relative">
                {f.comingSoon && (
                  <div
                    className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full z-10"
                    style={{ background: f.color + '18', color: f.color, border: `1px solid ${f.color}40` }}
                  >
                    {language === 'ar' ? 'قريباً' : 'Soon'}
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: f.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: f.color }} />
                  </div>
                  <p className="font-bold text-xs mb-1">{ft(f.titleKey)}</p>
                  <p className="text-[10px] text-foreground/60 dark:text-white/70 leading-relaxed">{ft(f.descKey)}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-[10px] text-foreground/60 dark:text-white/60 py-2">
        {t('madeWith')}
      </div>
    </motion.div>
  );
}
