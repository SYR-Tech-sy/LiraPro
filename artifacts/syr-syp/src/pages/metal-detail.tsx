import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Bell, X, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetMetalPrices } from '@workspace/api-client-react';
import { useApp } from '@/context/app-context';
import { useUser } from '@/context/auth-context';
import { GuestModal } from '@/components/guest-modal';
import { LiveBadge } from '@/components/live-badge';
import { MetalIcon } from '@/components/metal-icon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

const METAL_INFO: Record<string, { color: string; bgColor: string }> = {
  XAU: { color: '#d97706', bgColor: '#fef3c7' },
  XAG: { color: '#6b7280', bgColor: '#f3f4f6' },
  XPT: { color: '#0284c7', bgColor: '#e0f2fe' },
  XPD: { color: '#7c3aed', bgColor: '#ede9fe' },
  XCU: { color: '#b45309', bgColor: '#fef3c7' },
  HG:  { color: '#b45309', bgColor: '#fef3c7' },
};

function generateHistory(baseRate: number, period: Period) {
  const points = period === 'daily' ? 24 : period === 'weekly' ? 7 : 30;
  const labels = period === 'daily'
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : period === 'weekly'
      ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
      : Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  let rate = baseRate * (1 + (Math.random() - 0.5) * 0.03);
  return Array.from({ length: points }, (_, i) => {
    rate = rate * (1 + (Math.random() - 0.5) * 0.006);
    return { label: labels[i] ?? `${i + 1}`, rate: parseFloat(rate.toFixed(2)) };
  });
}

function AlertModal({ onClose, symbol, nameAr, currentBuy, currentSell, color, t, formatNum }: {
  onClose: () => void; symbol: string; nameAr: string;
  currentBuy: number; currentSell: number; color: string;
  t: (k: string) => string; formatNum: (v: number, o?: any) => string;
}) {
  const [alertType, setAlertType] = useState<'buy' | 'sell'>('buy');
  const [targetPrice, setTargetPrice] = useState('');
  const [saved, setSaved] = useState(false);

  const handleCreate = () => {
    if (!targetPrice) return;
    const alerts = JSON.parse(localStorage.getItem('syp-alerts') || '[]');
    alerts.push({ id: Date.now(), code: symbol, type: alertType, target: parseFloat(targetPrice), nameAr, created: new Date().toISOString() });
    localStorage.setItem('syp-alerts', JSON.stringify(alerts));
    setSaved(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color }} /> {t('priceAlert')} - {nameAr}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">
          {saved ? (
            <div className="text-center py-6">
              <Bell className="w-12 h-12 mx-auto mb-3" style={{ color }} />
              <p className="font-bold text-lg" style={{ color }}>تم إنشاء التنبيه!</p>
            </div>
          ) : (
            <>
              <div className="bg-secondary/50 rounded-xl p-3 mb-4 flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('buyPrice')}</p>
                  <p className="font-bold text-sm text-foreground dark:text-white">{formatNum(currentBuy, { decimals: 0 })} ل.س</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('sellPrice')}</p>
                  <p className="font-bold text-sm text-foreground dark:text-white">{formatNum(currentSell, { decimals: 0 })} ل.س</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('priceType')}</p>
              <div className="flex gap-2 mb-4">
                {(['buy', 'sell'] as const).map(type => (
                  <button key={type} onClick={() => setAlertType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${alertType === type ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                    {type === 'buy' ? t('buyPrice') : t('sellPrice')}
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('targetPrice')}</p>
              <Input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                placeholder={`${formatNum(alertType === 'buy' ? currentBuy : currentSell, { decimals: 0 })}`}
                className="mb-4 h-12 text-lg" dir="ltr" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
                <Button className="flex-1" onClick={handleCreate} disabled={!targetPrice}>
                  <Bell className="w-4 h-4 ml-1" /> {t('createAlert')}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function MetalDetailPage() {
  const [, params] = useRoute('/app/metal/:symbol');
  const [, navigate] = useLocation();
  const symbol = params?.symbol ?? 'XAU';
  const [period, setPeriod] = useState<Period>('daily');
  const [showAlert, setShowAlert] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const { data } = useGetMetalPrices();
  const { t, formatNum, getBuyRate, getSellRate } = useApp();
  const { isSignedIn } = useUser();

  const metal = data?.metals.find(m => m.symbol === symbol);
  const info = METAL_INFO[symbol] ?? { color: '#003C32', bgColor: '#e0f2fe' };

  const priceSYP = metal?.priceSYP ?? 0;
  const priceUSD = metal?.priceUSD ?? 0;
  const buyPrice = getBuyRate(priceSYP);
  const sellPrice = getSellRate(priceSYP);

  const history = generateHistory(priceSYP || 1, period);
  const first = history[0]?.rate ?? priceSYP;
  const last = history[history.length - 1]?.rate ?? priceSYP;
  const change = first > 0 ? ((last - first) / first) * 100 : 0;
  const isUp = change >= 0;

  const handleAlertClick = () => {
    if (!isSignedIn) { setShowGuestModal(true); return; }
    setShowAlert(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/app/metals')} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <MetalIcon symbol={symbol} size={36} />
            <div>
              <h2 className="text-lg font-bold">{metal?.nameAr ?? symbol}</h2>
              <p className="text-xs text-muted-foreground">{metal?.name} · لكل {metal?.unit}</p>
            </div>
          </div>
          <LiveBadge />
          <button onClick={handleAlertClick}
            className="flex items-center gap-1 bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1.5 text-xs font-bold hover:bg-accent/20 transition-colors">
            <Bell className="w-3.5 h-3.5" /> {t('alert')}
          </button>
        </div>

        <Card className="border-none shadow-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${info.color}dd, ${info.color}99)` }}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white/70 text-xs mb-1">السعر بالليرة السورية</p>
                <div className="text-3xl font-bold text-white">
                  {formatNum(priceSYP, { decimals: 0 })} <span className="text-base font-normal">ل.س</span>
                </div>
                <p className="text-white/70 text-xs mt-1" dir="ltr">
                  ${formatNum(priceUSD, { decimals: priceUSD < 10 ? 3 : 2 })}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-white/20 text-white' : 'bg-black/20 text-white'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}{change.toFixed(2)}%
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-white/60 text-[10px]">{t('buyPrice')}</p>
                <p className="font-bold text-sm text-white">{formatNum(buyPrice, { decimals: 0 })} ل.س</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px]">{t('sellPrice')}</p>
                <p className="font-bold text-sm text-white">{formatNum(sellPrice, { decimals: 0 })} ل.س</p>
              </div>
              <div className="mr-auto flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                <span className="text-[10px] text-white/80 font-semibold">{t('live')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${period === p ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-muted-foreground'}`}>
              {t(p)}
            </button>
          ))}
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} width={65} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [`${formatNum(v, { decimals: 0 })} ل.س`, 'السعر']}
                />
                <Line type="monotone" dataKey="rate" stroke={info.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showAlert && metal && (
          <AlertModal onClose={() => setShowAlert(false)} symbol={symbol} nameAr={metal.nameAr}
            currentBuy={buyPrice} currentSell={sellPrice} color={info.color} t={t} formatNum={formatNum} />
        )}
      </AnimatePresence>

      <GuestModal open={showGuestModal} onClose={() => setShowGuestModal(false)} feature="تنبيهات الأسعار" />
    </>
  );
}
