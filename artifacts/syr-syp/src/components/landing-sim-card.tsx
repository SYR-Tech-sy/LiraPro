import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store, TrendingUp, Gem, Zap, Sprout, Leaf,
  ShoppingBag, ShoppingCart, Building2, ChevronUp, ChevronDown, MapPin,
  Navigation, Droplets, Car,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GoldenBadge } from '@/components/golden-badge';

const CAT_COLOR: Record<string, string> = {
  currency: '#0284c7', gold: '#f59e0b', fuel: '#ef4444',
  agriculture: '#65a30d', vegetables: '#16a34a', food: '#22c55e',
  meat: '#dc2626', construction: '#78716c', oils: '#a16207', cars: '#7c3aed',
};
const CAT_LABEL: Record<string, string> = {
  currency: 'صرافة', gold: 'ذهب', fuel: 'محروقات',
  agriculture: 'محاصيل', vegetables: 'خضار', food: 'غذاء',
  meat: 'لحوم', construction: 'بناء', oils: 'زيت', cars: 'سيارات',
};

function CatIcon({ cat, className, color }: { cat: string; className?: string; color?: string }) {
  const p = { className: className ?? 'w-5 h-5', style: color ? { color } : undefined };
  switch (cat) {
    case 'currency':     return <TrendingUp {...p} />;
    case 'gold':         return <Gem {...p} />;
    case 'fuel':         return <Zap {...p} />;
    case 'agriculture':  return <Sprout {...p} />;
    case 'vegetables':   return <Leaf {...p} />;
    case 'food':         return <ShoppingBag {...p} />;
    case 'meat':         return <ShoppingCart {...p} />;
    case 'construction': return <Building2 {...p} />;
    case 'oils':         return <Droplets {...p} />;
    case 'cars':         return <Car {...p} />;
    default:             return <Store {...p} />;
  }
}

const SIM_CATS = Object.keys(CAT_LABEL);

const SIM_VENDORS = [
  { cat: 'currency',     price: 13520,  delta: +0.31, unit: 'ل.س/دولار', gov: 'دمشق' },
  { cat: 'gold',         price: 285000, delta: -0.52, unit: 'ل.س/غرام', gov: 'دمشق' },
  { cat: 'fuel',         price: 8500,   delta: +1.20, unit: 'ل.س/لتر',  gov: 'حلب' },
  { cat: 'agriculture',  price: 1200,   delta: -0.84, unit: 'ل.س/كغ',   gov: 'إدلب' },
  { cat: 'vegetables',   price: 820,    delta: +0.18, unit: 'ل.س/كغ',   gov: 'إدلب' },
  { cat: 'food',         price: 7800,   delta: +0.07, unit: 'ل.س/كغ',   gov: 'دمشق' },
  { cat: 'meat',         price: 24000,  delta: +0.35, unit: 'ل.س/كغ',   gov: 'حلب' },
  { cat: 'construction', price: 12500,  delta: -0.15, unit: 'ل.س/طن',   gov: 'ريف دمشق' },
  { cat: 'oils',         price: 18000,  delta: +0.22, unit: 'ل.س/لتر',  gov: 'دمشق' },
  { cat: 'cars',         price: 8500000,delta: -1.10, unit: 'ل.س',      gov: 'دمشق' },
];

/* ─── Ticker item ─────────────────────────────────────────────────── */
function TickerItem({ cat }: { cat: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0" style={{ width: 52 }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: (CAT_COLOR[cat] ?? '#003C32') + '22' }}
      >
        <CatIcon cat={cat} className="w-5 h-5" color={CAT_COLOR[cat]} />
      </div>
      <span className="text-[9px] text-muted-foreground font-semibold whitespace-nowrap">{CAT_LABEL[cat]}</span>
    </div>
  );
}

export function LandingSimCard() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const t = setInterval(() => {
      setDir('out');
      setTimeout(() => {
        setIdx(i => (i + 1) % SIM_VENDORS.length);
        setDir('in');
      }, 200);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  const cur = SIM_VENDORS[idx]!;
  const catLabel = CAT_LABEL[cur.cat] ?? cur.cat;
  const vendorName = `LiraPro ${catLabel}`;
  const isUp = cur.delta >= 0;

  /* ─── Ticker: 3 copies so right side always has incoming icons ──── */
  const ITEM_W = 52;
  const GAP    = 10;
  const COPY_W = SIM_CATS.length * ITEM_W + (SIM_CATS.length) * GAP; // gap after each item = trailing gap included via paddingRight

  return (
    <div className="pointer-events-none w-full max-w-[320px]" dir="rtl">
      <style>{`
        @keyframes lira-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-${COPY_W}px); }
        }
        .lira-ticker-track {
          animation: lira-ticker ${SIM_CATS.length * 1.1}s linear infinite;
          will-change: transform;
        }
      `}</style>

      <Card className="border-border shadow-md">
        <CardContent className="p-4 flex flex-col gap-2.5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">أسعار السوق المحلية</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              مباشر
            </span>
          </div>

          {/* Location row */}
          <div className="flex items-center gap-2 py-0.5">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(90deg, hsl(162 100% 18%) 0%, hsl(162 75% 36%) 100%)' }}
            >
              <Navigation className="w-3 h-3" />
              حسب موقعي
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-foreground border border-border bg-background/80">
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
              اختر المحافظة
            </div>
          </div>

          {/*
            Category ticker — seamless infinite scroll
            ─────────────────────────────────────────
            Strategy: 3 identical copies side-by-side (direction: ltr).
            Animate by exactly ONE copy width (COPY_W px) so when the
            animation resets, copy-2 is visually where copy-1 was.
            Using pixel-based animation (not %) avoids fractional rounding.
            Each item has fixed width (ITEM_W) + gap after it (GAP).
          */}
          <div
            className="overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 14%, black 86%, transparent)' }}
          >
            <div
              className="lira-ticker-track flex"
              style={{ direction: 'ltr', gap: GAP }}
            >
              {/* 3 copies — ensures right edge always has incoming icons */}
              {[0, 1, 2].flatMap(copy =>
                SIM_CATS.map(c => (
                  <TickerItem key={`${copy}-${c}`} cat={c} />
                ))
              )}
            </div>
          </div>

          {/* Vendor display */}
          <div className="rounded-2xl bg-secondary/40 p-3 min-h-[76px] overflow-hidden">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: dir === 'in' ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                  {vendorName}
                </span>
                <GoldenBadge size={13} showGlow={false} />
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <MapPin className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[9px] text-muted-foreground">{cur.gov}</span>
              </div>
              <div className="flex items-end gap-2">
                <CatIcon cat={cur.cat} className="w-5 h-5" color={CAT_COLOR[cur.cat]} />
                <span className="text-2xl font-black text-primary leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {cur.price.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-muted-foreground mb-0.5">{cur.unit}</span>
                <div
                  className="flex items-center gap-0.5 mb-0.5"
                  style={{ color: isUp ? '#16a34a' : '#ef4444' }}
                >
                  {isUp
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">{Math.abs(cur.delta).toFixed(2)}%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground text-center justify-center leading-snug px-1">
            <GoldenBadge size={12} showGlow={false} />
            <span>اطلب عضوية معلن الأسعار ليظهر اسم نشاطك التجاري أو شركتك ضمن العرض الحالي</span>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
