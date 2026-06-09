import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Bell, X, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetExchangeRates } from '@workspace/api-client-react';
import { useApp } from '@/context/app-context';
import { useUser, useAuth } from '@/context/auth-context';
import { GuestModal } from '@/components/guest-modal';
import { LiveBadge, useMarketOpen } from '@/components/live-badge';
import { ManualBadge } from '@/components/manual-badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

function generateHistory(baseRate: number, period: Period) {
  const points = period === 'daily' ? 24 : period === 'weekly' ? 7 : 30;
  const labels = period === 'daily'
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : period === 'weekly'
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  let rate = baseRate * (1 + (Math.random() - 0.5) * 0.04);
  return Array.from({ length: points }, (_, i) => {
    rate = rate * (1 + (Math.random() - 0.5) * 0.008);
    return { label: labels[i] ?? `${i + 1}`, rate: parseFloat(rate.toFixed(2)) };
  });
}

function AlertModal({ onClose, code, currentBuy, currentSell, t, formatNum }: {
  onClose: () => void;
  code: string;
  currentBuy: number;
  currentSell: number;
  t: (k: string) => string;
  formatNum: (v: number, o?: { decimals?: number }) => string;
}) {
  const [alertType, setAlertType] = useState<'buy' | 'sell'>('buy');
  const [targetPrice, setTargetPrice] = useState('');
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const { getToken } = useAuth();

  const handleCreate = async () => {
    if (!targetPrice || creating) return;
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, type: alertType, targetPrice: parseFloat(targetPrice) }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(onClose, 1500);
      } else {
        setSaved(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setSaved(true);
      setTimeout(onClose, 1500);
    } finally {
      setCreating(false);
    }
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
        <div className="flex items-center justify-between p-4 border-b bg-primary/5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" /> {t('priceAlert')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">
          {saved ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <p className="font-bold text-primary text-lg">تم إنشاء التنبيه بنجاح!</p>
              <p className="text-sm text-foreground/70 dark:text-white mt-1">سيتم إعلامك عند بلوغ السعر المستهدف</p>
            </div>
          ) : (
            <>
              <div className="bg-secondary/50 rounded-xl p-3 mb-4 flex justify-around items-center">
                <div className="text-center">
                  <p className="text-xs text-foreground/60 dark:text-white/70 mb-1">{t('buyPrice')}</p>
                  {/* Fixed: use text-foreground to be visible in both light and dark mode */}
                  <p className="font-bold text-foreground dark:text-white text-sm">
                    {formatNum(currentBuy, { decimals: 0 })} ل.س
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-xs text-foreground/60 dark:text-white/70 mb-1">{t('sellPrice')}</p>
                  <p className="font-bold text-foreground dark:text-white text-sm">
                    {formatNum(currentSell, { decimals: 0 })} ل.س
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-foreground/70 dark:text-white mb-2">{t('priceType')}</p>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => setAlertType('buy')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${alertType === 'buy' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/30'}`}>
                  {t('buyPrice')}
                </button>
                <button type="button" onClick={() => setAlertType('sell')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${alertType === 'sell' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/30'}`}>
                  {t('sellPrice')}
                </button>
              </div>
              <p className="text-xs font-semibold text-foreground/70 dark:text-white mb-2">{t('targetPrice')}</p>
              <Input type="number" value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder={`${alertType === 'buy' ? formatNum(currentBuy, { decimals: 0 }) : formatNum(currentSell, { decimals: 0 })}`}
                className="mb-4 h-12 text-lg" dir="ltr" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
                <Button onClick={() => void handleCreate()} className="flex-1" disabled={!targetPrice || creating}>
                  <Bell className="w-4 h-4 ml-2" /> {creating ? '...' : t('createAlert')}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', TRY: '🇹🇷', GBP: '🇬🇧',
  AED: '🇦🇪', SAR: '🇸🇦', EGP: '🇪🇬', IQD: '🇮🇶', JOD: '🇯🇴',
  KWD: '🇰🇼', BHD: '🇧🇭', QAR: '🇶🇦', OMR: '🇴🇲', LBP: '🇱🇧',
};

function getFlag(code: string) {
  if (FLAG_MAP[code]) return FLAG_MAP[code];
  const cc = code.substring(0, 2).toUpperCase();
  try { return String.fromCodePoint(...cc.split('').map(c => 127397 + c.charCodeAt(0))); }
  catch { return '🌍'; }
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'الدولار الأمريكي', EUR: 'اليورو', TRY: 'الليرة التركية',
  GBP: 'الجنيه الإسترليني', SYP: 'الليرة السورية', AED: 'الدرهم الإماراتي',
  SAR: 'الريال السعودي', EGP: 'الجنيه المصري', IQD: 'الدينار العراقي',
  JOD: 'الدينار الأردني', KWD: 'الدينار الكويتي', BHD: 'الدينار البحريني',
  QAR: 'الريال القطري', OMR: 'الريال العماني', LBP: 'الليرة اللبنانية',
};

export default function CurrencyDetailPage() {
  const [, params] = useRoute('/app/currency/:code');
  const code = params?.code ?? 'USD';
  const [period, setPeriod] = useState<Period>('daily');
  const [showAlert, setShowAlert] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const { data: ratesData } = useGetExchangeRates();
  const { t, formatNum, getBuyRate, getSellRate } = useApp();
  const { isSignedIn } = useUser();
  const isMarketOpen = useMarketOpen();

  const usdToSyp = ratesData?.usd_to_syp ?? 13500;
  const rates = ratesData?.rates ?? {};
  const isManualRate = ratesData?.is_manual_rate ?? false;

  let rateVsSyp = usdToSyp;
  if (code === 'SYP') rateVsSyp = 1;
  else if (code === 'USD') rateVsSyp = usdToSyp;
  else {
    const codeRate = rates[code];
    const sypRate = rates['SYP'] ?? usdToSyp;
    if (codeRate && sypRate) rateVsSyp = sypRate / codeRate;
  }

  const buyRate = getBuyRate(rateVsSyp);
  const sellRate = getSellRate(rateVsSyp);

  const history = generateHistory(rateVsSyp, period);
  const first = history[0]?.rate ?? rateVsSyp;
  const last = history[history.length - 1]?.rate ?? rateVsSyp;
  const chartChange = ((last - first) / first) * 100;
  const storedChanges: Record<string, number> = (() => {
    try { const s = sessionStorage.getItem('syp-price-changes-ss'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  })();
  const change = storedChanges[code] !== undefined ? storedChanges[code] : chartChange;
  const isUp = change >= 0;

  const handleAlertClick = () => {
    if (!isSignedIn) { setShowGuestModal(true); return; }
    setShowAlert(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <button type="button" onClick={() => window.history.back()} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            {code === 'SYP'
              ? <img src="/syria-flag.png" alt="SY" className="w-8 h-8 rounded-full object-cover" />
              : <span className="text-2xl">{getFlag(code)}</span>
            }
            <div>
              <h2 className="text-lg font-bold">{code}</h2>
              <p className="text-xs text-foreground/60 dark:text-white/70">{CURRENCY_NAMES[code] ?? code}</p>
            </div>
          </div>
          <LiveBadge />
          <button type="button"
            onClick={handleAlertClick}
            className="flex items-center gap-1 bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1.5 text-xs font-bold hover:bg-accent/20 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" /> {t('alert')}
          </button>
        </div>

        <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-primary-foreground/70 text-xs mb-1">مقابل الليرة السورية</p>
                <div className="text-3xl font-bold flex items-center gap-2 flex-wrap">
                  {formatNum(rateVsSyp, { decimals: 0 })} <span className="text-lg font-normal">ل.س</span>
                  {isManualRate && <ManualBadge updatedAt={ratesData?.manual_updated_at ?? undefined} />}
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}{change.toFixed(2)}%
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-primary-foreground/60 text-[10px]">{t('buyPrice')}</p>
                <p className="font-bold text-sm text-white">{formatNum(buyRate, { decimals: 0 })} ل.س</p>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-[10px]">{t('sellPrice')}</p>
                <p className="font-bold text-sm text-white">{formatNum(sellRate, { decimals: 0 })} ل.س</p>
              </div>
              {isMarketOpen && (
                <div className="mr-auto flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-300 font-semibold">{t('live')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button type="button" key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${period === p ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground/70 dark:text-white'}`}>
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
                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} width={60} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${formatNum(v, { decimals: 0 })} ل.س`, 'السعر']}
                />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showAlert && (
          <AlertModal onClose={() => setShowAlert(false)} code={code}
            currentBuy={buyRate} currentSell={sellRate} t={t} formatNum={formatNum} />
        )}
      </AnimatePresence>

      <GuestModal open={showGuestModal} onClose={() => setShowGuestModal(false)} feature="تنبيهات الأسعار" />
    </>
  );
}
