import React, { useState } from 'react';
import { useGetExchangeRates } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, Bell, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/app-context';
import { LiveBadge } from '@/components/live-badge';
import { ManualBadge } from '@/components/manual-badge';

const PINNED = ['SYP', 'USD', 'TRY', 'EUR', 'AED', 'SAR'];

const CURRENCY_NAMES: Record<string, string> = {
  SYP: 'الليرة السورية', USD: 'الدولار الأمريكي', EUR: 'اليورو',
  TRY: 'الليرة التركية', GBP: 'الجنيه الإسترليني', AED: 'الدرهم الإماراتي',
  SAR: 'الريال السعودي', EGP: 'الجنيه المصري', IQD: 'الدينار العراقي',
  JOD: 'الدينار الأردني', KWD: 'الدينار الكويتي', BHD: 'الدينار البحريني',
  QAR: 'الريال القطري', OMR: 'الريال العماني', LBP: 'الليرة اللبنانية',
  CNY: 'اليوان الصيني', RUB: 'الروبل الروسي',
};

const EXCLUDED = ['ILS', 'IRR'];

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', TRY: '🇹🇷', GBP: '🇬🇧',
  AED: '🇦🇪', SAR: '🇸🇦', EGP: '🇪🇬', IQD: '🇮🇶', JOD: '🇯🇴',
  KWD: '🇰🇼', BHD: '🇧🇭', QAR: '🇶🇦', OMR: '🇴🇲', LBP: '🇱🇧',
  CNY: '🇨🇳', RUB: '🇷🇺',
};

function getFlag(code: string) {
  if (FLAG_MAP[code]) return FLAG_MAP[code];
  const cc = code.substring(0, 2).toUpperCase();
  try { return String.fromCodePoint(...cc.split('').map(c => 127397 + c.charCodeAt(0))); }
  catch { return '🌍'; }
}

function CurrencyFlag({ code }: { code: string }) {
  if (code === 'SYP') {
    return (
      <img
        src="/syria-flag.png"
        alt="سوريا"
        className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border/30"
      />
    );
  }
  return <span className="text-xl flex-shrink-0">{getFlag(code)}</span>;
}

export default function CurrenciesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetExchangeRates();
  const { formatNum, getCustomBuyRate, getCustomSellRate } = useApp();
  const [, navigate] = useLocation();

  const usdToSyp = data?.usd_to_syp ?? 0;
  const rates = data?.rates ?? {};

  function getCurrencyRateSYP(code: string): number {
    if (code === 'SYP') return 1;
    const codeRate = rates[code];
    if (!codeRate || !usdToSyp) return 0;
    return usdToSyp / codeRate;
  }

  const allCurrencies = data
    ? (() => {
        const all = ['SYP', ...Object.keys(rates).filter(c => c !== 'SYP' && !EXCLUDED.includes(c))];
        const pinned = PINNED.filter(c => all.includes(c));
        const others = all.filter(c => !PINNED.includes(c)).sort();
        return [...pinned, ...others];
      })()
    : [];

  const filtered = allCurrencies.filter(c =>
    c.toLowerCase().includes(search.toLowerCase()) ||
    (CURRENCY_NAMES[c] ?? '').includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3 pb-10">
      {/* Global prices notice */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/20">
        <TrendingUpIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed flex-1">
          هذه الأسعار وفق الأسعار العالمية، لعرض الأسعار المحلية انتقل إلى قسم الصرافة.
        </span>
        <button
          onClick={() => navigate('/app/home?cat=currency')}
          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-xl border border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-900/40 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <TrendingUpIcon className="w-3 h-3" /> الصرافة
        </button>
      </div>
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm pt-1 pb-3 -mx-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">قائمة العملات</h2>
          <LiveBadge />
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 dark:text-white/50" />
          <Input
            placeholder="ابحث عن عملة (مثال: USD، دولار...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-3 pr-9 h-11 rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {!search && (
        <p className="text-[11px] text-foreground/60 dark:text-white/70 px-1 font-semibold -mb-1">
          الأكثر استخداماً
        </p>
      )}

      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          : filtered.map((code, index) => {
              const rateSYP = getCurrencyRateSYP(code);
              const buy = getCustomBuyRate(code, rateSYP);
              const sell = getCustomSellRate(code, rateSYP);
              const isPinned = PINNED.includes(code) && !search;
              const isSYP = code === 'SYP';
              const cardContent = (
                <CardContent className="p-3 flex items-center gap-3">
                  <CurrencyFlag code={code} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm" dir="ltr">{code}</span>
                      {isPinned && (
                        <span className="text-[8px] bg-primary/10 text-primary px-1 rounded font-semibold">مثبّت</span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground/60 dark:text-white/70 truncate">{CURRENCY_NAMES[code] ?? ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-primary dark:text-white" dir="ltr">
                        {rateSYP > 0 ? formatNum(rateSYP, { decimals: rateSYP >= 1 ? 0 : 4 }) : '-'}
                      </span>
                      {data?.is_manual_rate && code === 'USD' && <ManualBadge />}
                    </div>
                    <span className="text-[9px] text-foreground/60 dark:text-white/60">ل.س</span>
                    {rateSYP > 0 && (
                      <div className="flex gap-1 text-[8px] text-foreground/60 dark:text-white/60">
                        <span>ش:{formatNum(buy, { decimals: rateSYP >= 1 ? 0 : 4 })}</span>
                        <span>ب:{formatNum(sell, { decimals: rateSYP >= 1 ? 0 : 4 })}</span>
                      </div>
                    )}
                  </div>
                  {!isSYP && <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </CardContent>
              );
              return (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                >
                  {isSYP ? (
                    <Card className={`border-border shadow-sm overflow-hidden ${isPinned ? 'border-primary/20' : ''}`}>
                      {cardContent}
                    </Card>
                  ) : (
                    <Link href={`/app/currency/${code}`}>
                      <Card className={`border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/30 ${isPinned ? 'border-primary/20' : ''}`}>
                        {cardContent}
                      </Card>
                    </Link>
                  )}
                </motion.div>
              );
            })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-10 text-foreground/70 dark:text-white">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>لا توجد نتائج مطابقة</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
