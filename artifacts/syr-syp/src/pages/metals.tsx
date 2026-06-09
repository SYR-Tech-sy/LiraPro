import React from 'react';
import { useGetMetalPrices } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ChevronLeft, Gem } from "lucide-react";
import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/app-context';
import { MetalIcon } from '@/components/metal-icon';
import { LiveBadge } from '@/components/live-badge';
import { ManualBadge } from '@/components/manual-badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 }
};

const METAL_COLORS: Record<string, { bg: string; darkBg: string }> = {
  XAU: { bg: 'from-yellow-400 to-amber-500',   darkBg: 'dark:from-yellow-600 dark:to-amber-700' },
  XAG: { bg: 'from-gray-300 to-slate-400',     darkBg: 'dark:from-gray-500 dark:to-slate-600' },
  XPT: { bg: 'from-sky-400 to-blue-500',       darkBg: 'dark:from-sky-600 dark:to-blue-700' },
  XPD: { bg: 'from-purple-400 to-violet-500',  darkBg: 'dark:from-purple-600 dark:to-violet-700' },
  XCU: { bg: 'from-orange-400 to-amber-600',   darkBg: 'dark:from-orange-600 dark:to-amber-800' },
  HG:  { bg: 'from-orange-400 to-amber-600',   darkBg: 'dark:from-orange-600 dark:to-amber-800' },
};

export default function MetalsPage() {
  const { data, isLoading } = useGetMetalPrices();
  const { formatNum, getBuyRate, getSellRate } = useApp();
  const [, navigate] = useLocation();

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col gap-4 pb-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">أسعار المعادن الثمينة</h2>
        <LiveBadge />
      </div>

      {/* Global prices notice */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20">
        <Gem className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed flex-1">
          هذه الأسعار وفق الأسعار العالمية، لعرض الأسعار المحلية انتقل إلى قسم الذهب.
        </span>
        <button type="button"
          onClick={() => navigate('/app/home?cat=gold')}
          className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-1 rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-100 dark:bg-amber-900/40 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Gem className="w-3 h-3" /> الذهب
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-3">
          {data.metals.map((metal) => {
            const style = METAL_COLORS[metal.symbol] ?? { bg: 'from-gray-400 to-gray-500', text: 'text-gray-700' };
            const buy = getBuyRate(metal.priceSYP);
            const sell = getSellRate(metal.priceSYP);
            return (
              <motion.div key={metal.symbol} variants={itemVariants}>
                <Link href={`/app/metal/${metal.symbol}`}>
                  <Card className="border-border shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30 hover:shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Left color bar with SVG icon */}
                        <div className={`bg-gradient-to-b ${style.bg} ${style.darkBg} flex items-center justify-center w-16 flex-shrink-0`}>
                          <MetalIcon symbol={metal.symbol} size={36} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm">{metal.nameAr}</h3>
                                {metal.isManual && <ManualBadge updatedAt={metal.updatedAt ?? undefined} />}
                              </div>
                              <p className="text-[10px] text-foreground/60 dark:text-white/70">{metal.name} · {metal.symbol}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`text-xs font-bold px-2 py-0.5 rounded-full bg-secondary`}>
                                لكل {metal.unit}
                              </div>
                              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="font-bold text-base text-primary dark:text-white leading-none">
                                {formatNum(metal.priceSYP, { decimals: 0 })}
                                <span className="text-xs font-normal text-foreground/60 dark:text-white/60 mr-1">ل.س</span>
                              </p>
                              <p className="text-xs text-foreground/60 dark:text-white/70 mt-0.5" dir="ltr">
                                ${formatNum(metal.priceUSD, { decimals: metal.priceUSD < 10 ? 3 : 2 })}
                              </p>
                            </div>
                            <div className="text-left text-[10px] text-foreground/60 dark:text-white/70">
                              <p>ش: {formatNum(buy, { decimals: 0 })}</p>
                              <p>ب: {formatNum(sell, { decimals: 0 })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 text-foreground/70 dark:text-white">لا تتوفر بيانات</div>
      )}

      <div className="mt-2 p-3 rounded-xl bg-secondary/50 text-xs text-foreground/60 dark:text-white/70 text-center">
        <TrendingUp className="w-3.5 h-3.5 inline ml-1" />
        جميع الأسعار مباشرة بالسعر السوقي · اضغط على أي معدن لعرض التفاصيل والرسم البياني
      </div>
    </motion.div>
  );
}
