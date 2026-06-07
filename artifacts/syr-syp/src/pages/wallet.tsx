import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Wallet, Trash2, Search, Globe, MapPin, ShoppingBag, Gem, Zap, Leaf, Building2, Droplets, Bitcoin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-context';
import { useGetExchangeRates, useGetGoldPrices } from '@workspace/api-client-react';
import { useUser } from '@/context/auth-context';
import { GuestModal } from '@/components/guest-modal';

type HoldingType = 'currency' | 'gold' | 'crypto' | 'commodity';
type PricingType = 'local' | 'global';

interface Holding {
  id: string;
  type: HoldingType;
  code: string;
  name: string;
  amount: number;
  addedAt: string;
}

const GOLD_KARATS = [14, 18, 21, 22, 24];

const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'بيتكوين' },
  { id: 'ethereum', symbol: 'ETH', name: 'إيثيريوم' },
  { id: 'tether', symbol: 'USDT', name: 'تيثر' },
  { id: 'binancecoin', symbol: 'BNB', name: 'باينانس كوين' },
  { id: 'solana', symbol: 'SOL', name: 'سولانا' },
  { id: 'ripple', symbol: 'XRP', name: 'ريبل' },
  { id: 'usd-coin', symbol: 'USDC', name: 'يو إس دي كوين' },
  { id: 'cardano', symbol: 'ADA', name: 'كاردانو' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'دوجكوين' },
  { id: 'tron', symbol: 'TRX', name: 'ترون' },
];

const PINNED = ['SYP', 'USD', 'TRY', 'EUR', 'AED', 'SAR'];

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', TRY: '🇹🇷', GBP: '🇬🇧',
  AED: '🇦🇪', SAR: '🇸🇦', EGP: '🇪🇬', IQD: '🇮🇶', JOD: '🇯🇴',
};

function getFlag(code: string) {
  if (code === 'SYP') return null;
  if (FLAG_MAP[code]) return FLAG_MAP[code];
  const cc = code.substring(0, 2).toUpperCase();
  try { return String.fromCodePoint(...cc.split('').map(c => 127397 + c.charCodeAt(0))); }
  catch { return '🌍'; }
}

function CurrencyFlagIcon({ code }: { code: string }) {
  if (code === 'SYP') return <img src="/syria-flag.png" alt="SY" className="w-6 h-6 rounded-full object-cover" />;
  return <span className="text-lg">{getFlag(code) ?? '🌍'}</span>;
}

const COMMODITY_CATS = [
  { id: 'gold', label: 'ذهب', icon: Gem, color: '#f59e0b' },
  { id: 'fuel', label: 'محروقات', icon: Zap, color: '#ef4444' },
  { id: 'food', label: 'غذاء', icon: ShoppingBag, color: '#22c55e' },
  { id: 'vegetables', label: 'خضار', icon: Leaf, color: '#16a34a' },
  { id: 'construction', label: 'بناء', icon: Building2, color: '#78716c' },
  { id: 'oils', label: 'الزيت', icon: Droplets, color: '#78a75a' },
  { id: 'crypto', label: 'كريبتو', icon: Bitcoin, color: '#f97316' },
];

interface PricingTypeModalProps {
  onSelect: (type: PricingType) => void;
  onClose: () => void;
}

function PricingTypeModal({ onSelect, onClose }: PricingTypeModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-base">نوع التسعير</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">اختر كيفية تقييم الممتلكات</p>
          <button
            onClick={() => onSelect('local')}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-right"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">بالسعر المحلي</p>
              <p className="text-xs text-muted-foreground mt-0.5">يستخدم أسعار مزودي السوق المحلية</p>
            </div>
          </button>
          <button
            onClick={() => onSelect('global')}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-right"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">بالسعر العالمي</p>
              <p className="text-xs text-muted-foreground mt-0.5">يستخدم الأسعار الدولية من المصادر العالمية</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface AddHoldingModalProps {
  onClose: () => void;
  onAdd: (h: Omit<Holding, 'id' | 'addedAt'>) => void;
  rates: Record<string, number>;
  goldData: any;
  t: (k: string) => string;
  pricingType: PricingType;
}

function AddHoldingModal({ onClose, onAdd, rates, goldData, t, pricingType }: AddHoldingModalProps) {
  const [type, setType] = useState<HoldingType>('currency');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [amount, setAmount] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [searchCurrency, setSearchCurrency] = useState('');

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,usd-coin,cardano,dogecoin,tron&vs_currencies=usd')
      .then(r => r.json())
      .then((data: any) => {
        const prices: Record<string, number> = {};
        CRYPTO_LIST.forEach(c => { if (data[c.id]) prices[c.symbol] = data[c.id].usd; });
        setCryptoPrices(prices);
      })
      .catch(() => {});
  }, []);

  const allCurrencies = ['SYP', ...Object.keys(rates).filter(c => c !== 'SYP' && c !== 'ILS')];
  const pinned = PINNED.filter(c => allCurrencies.includes(c));
  const others = allCurrencies.filter(c => !PINNED.includes(c)).sort();
  const currencyList = [...pinned, ...others];
  const filteredCurrencies = searchCurrency
    ? currencyList.filter(c => c.toLowerCase().includes(searchCurrency.toLowerCase()))
    : currencyList;

  const canAdd = type === 'commodity' ? (!!selectedCat && !!amount) : (!!selectedCode && !!amount);

  const handleAdd = () => {
    if (!canAdd) return;
    if (type === 'commodity') {
      const cat = COMMODITY_CATS.find(c => c.id === selectedCat);
      onAdd({ type: 'commodity', code: selectedCat, name: cat?.label ?? selectedCat, amount: parseFloat(amount) });
    } else {
      let name = selectedCode;
      if (type === 'gold') name = `ذهب عيار ${selectedCode}`;
      if (type === 'crypto') { const c = CRYPTO_LIST.find(x => x.symbol === selectedCode); name = c?.name ?? selectedCode; }
      onAdd({ type, code: selectedCode, name, amount: parseFloat(amount) });
    }
    onClose();
  };

  const TYPE_TABS: { id: HoldingType; label: string }[] = [
    { id: 'currency', label: t('currency') },
    { id: 'gold', label: t('gold') },
    { id: 'crypto', label: t('crypto') },
    { id: 'commodity', label: 'فئة / سلعة' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h3 className="font-bold text-base">{t('addHolding')}</h3>
            {pricingType && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pricingType === 'local' ? '📍 بالسعر المحلي' : '🌐 بالسعر العالمي'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_TABS.map(tp => (
              <button key={tp.id}
                onClick={() => { setType(tp.id); setSelectedCode(''); setSelectedCat(''); setAmount(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all min-w-[70px] ${type === tp.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/30'}`}>
                {tp.label}
              </button>
            ))}
          </div>

          {type === 'currency' && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="ابحث عن عملة..." value={searchCurrency}
                  onChange={e => setSearchCurrency(e.target.value)} className="h-9 pr-9" />
              </div>
              <div className="max-h-44 overflow-y-auto flex flex-col gap-1 rounded-xl border border-border p-1">
                {filteredCurrencies.map(c => (
                  <button key={c} onClick={() => setSelectedCode(c)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCode === c ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                    <CurrencyFlagIcon code={c} />
                    <span dir="ltr">{c}</span>
                    {PINNED.includes(c) && !searchCurrency && <span className="mr-auto text-[9px] opacity-50">مثبّت</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'gold' && (
            <div className="grid grid-cols-3 gap-2">
              {GOLD_KARATS.map(k => (
                <button key={k} onClick={() => setSelectedCode(k.toString())}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${selectedCode === k.toString() ? 'bg-yellow-600 text-white border-yellow-600 shadow' : 'border-border hover:border-yellow-400'}`}>
                  عيار {k}
                </button>
              ))}
            </div>
          )}

          {type === 'crypto' && (
            <div className="max-h-44 overflow-y-auto flex flex-col gap-1 rounded-xl border border-border p-1">
              {CRYPTO_LIST.map(c => (
                <button key={c.id} onClick={() => setSelectedCode(c.symbol)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCode === c.symbol ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                  <span className="font-mono text-xs font-bold w-10 text-left" dir="ltr">{c.symbol}</span>
                  <span>{c.name}</span>
                  {cryptoPrices[c.symbol] && (
                    <span className="mr-auto text-xs opacity-70" dir="ltr">
                      ${cryptoPrices[c.symbol] > 1000 ? Math.round(cryptoPrices[c.symbol]).toLocaleString() : cryptoPrices[c.symbol].toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {type === 'commodity' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">اختر الفئة</p>
              <div className="grid grid-cols-3 gap-2">
                {COMMODITY_CATS.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                      style={selectedCat === cat.id
                        ? { background: cat.color + '25', borderColor: cat.color, boxShadow: `0 0 0 2px ${cat.color}40` }
                        : { background: cat.color + '10', borderColor: cat.color + '40' }}>
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      <span className="text-[10px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedCat && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{pricingType === 'local' ? 'سيتم احتساب القيمة بناءً على متوسط أسعار المزودين المحليين' : 'سيتم احتساب القيمة بناءً على الأسعار العالمية'}</span>
                </div>
              )}
            </div>
          )}

          {(type !== 'commodity' ? !!selectedCode : !!selectedCat) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground/70 dark:text-white">
                {type === 'gold' ? t('weight') + ' (غرام)' : type === 'crypto' ? t('quantity') : type === 'commodity' ? 'الكمية / الوزن' : t('amount')}
              </label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" dir="ltr" className="h-12 text-lg font-bold" />
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>{t('cancel')}</Button>
          <Button className="flex-1" onClick={handleAdd} disabled={!canAdd}>
            <Plus className="w-4 h-4 ml-1" /> {t('add')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WalletPage() {
  const { formatNum, t } = useApp();
  const { data: ratesData } = useGetExchangeRates();
  const { data: goldData } = useGetGoldPrices();
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved = localStorage.getItem('syp-holdings');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pricingType, setPricingType] = useState<PricingType>('global');
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState<'SYP' | 'USD'>('SYP');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,usd-coin,cardano,dogecoin,tron&vs_currencies=usd')
      .then(r => r.json())
      .then((data: any) => {
        const prices: Record<string, number> = {};
        CRYPTO_LIST.forEach(c => { if (data[c.id]) prices[c.symbol] = data[c.id].usd; });
        setCryptoPrices(prices);
      })
      .catch(() => {});
  }, []);

  const rates = ratesData?.rates ?? {};
  const usdToSyp = ratesData?.usd_to_syp ?? 13500;

  const getHoldingValueSYP = (h: Holding): number => {
    if (h.type === 'currency') {
      if (h.code === 'SYP') return h.amount;
      const codeRate = rates[h.code];
      const sypRate = rates['SYP'] ?? usdToSyp;
      if (!codeRate || !sypRate) return 0;
      return h.amount * (sypRate / codeRate);
    }
    if (h.type === 'gold') {
      const karat = parseInt(h.code);
      const karatData = goldData?.karats.find((k: any) => k.karat === karat);
      return (karatData?.pricePerGramSYP ?? 0) * h.amount;
    }
    if (h.type === 'crypto') {
      const usdPrice = cryptoPrices[h.code] ?? 0;
      return usdPrice * h.amount * usdToSyp;
    }
    return 0;
  };

  const totalSYP = holdings.reduce((s, h) => s + getHoldingValueSYP(h), 0);
  const totalUSD = usdToSyp > 0 ? totalSYP / usdToSyp : 0;

  const addHolding = (h: Omit<Holding, 'id' | 'addedAt'>) => {
    const newH: Holding = { ...h, id: Date.now().toString(), addedAt: new Date().toISOString() };
    const updated = [...holdings, newH];
    setHoldings(updated);
    localStorage.setItem('syp-holdings', JSON.stringify(updated));
  };

  const removeHolding = (id: string) => {
    const updated = holdings.filter(h => h.id !== id);
    setHoldings(updated);
    localStorage.setItem('syp-holdings', JSON.stringify(updated));
  };

  const handleAddClick = () => {
    if (!isSignedIn) { setShowGuestModal(true); return; }
    setShowPricingModal(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t('wallet')}</h2>
        </div>

        <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-foreground/70 text-xs font-medium">إجمالي الممتلكات</p>
              <div className="flex rounded-lg overflow-hidden border border-white/20">
                {(['SYP', 'USD'] as const).map(c => (
                  <button key={c} onClick={() => setDisplayCurrency(c)}
                    className={`px-3 py-1 text-xs font-bold transition-all ${displayCurrency === c ? 'bg-white/20' : ''}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">
                {displayCurrency === 'SYP' ? `${formatNum(totalSYP, { decimals: 0 })} ل.س` : `$${formatNum(totalUSD, { decimals: 2 })}`}
              </p>
              <p className="text-primary-foreground/60 text-xs mt-2">
                {displayCurrency === 'SYP' ? `≈ $${formatNum(totalUSD, { decimals: 2 })}` : `≈ ${formatNum(totalSYP, { decimals: 0 })} ل.س`}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">{t('myHoldings')}</h3>
          <button onClick={handleAddClick}
            className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-bold shadow">
            <Plus className="w-3.5 h-3.5" /> {t('addHolding')}
          </button>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-12 text-foreground/70 dark:text-white">
            <Wallet className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">لا توجد ممتلكات بعد</p>
            <p className="text-xs mt-1">اضغط على إضافة لإضافة ممتلكاتك</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {holdings.map(h => {
              const valueSYP = getHoldingValueSYP(h);
              const valueUSD = usdToSyp > 0 ? valueSYP / usdToSyp : 0;
              return (
                <Card key={h.id} className="border-border shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-base flex-shrink-0">
                      {h.type === 'gold' ? '🥇' : h.type === 'crypto' ? '₿' : <CurrencyFlagIcon code={h.code} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{h.name}</p>
                      <p className="text-xs text-foreground/60 dark:text-white/70" dir="ltr">{h.amount} {h.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">{formatNum(valueSYP, { decimals: 0 })} ل.س</p>
                      <p className="text-xs text-foreground/60 dark:text-white/70">${formatNum(valueUSD, { decimals: 2 })}</p>
                    </div>
                    <button onClick={() => removeHolding(h.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showPricingModal && (
          <PricingTypeModal
            onClose={() => setShowPricingModal(false)}
            onSelect={pt => { setPricingType(pt); setShowPricingModal(false); setShowAdd(true); }}
          />
        )}
        {showAdd && (
          <AddHoldingModal onClose={() => setShowAdd(false)} onAdd={addHolding}
            rates={rates} goldData={goldData} t={t} pricingType={pricingType} />
        )}
      </AnimatePresence>

      <GuestModal open={showGuestModal} onClose={() => setShowGuestModal(false)} feature="المحفظة" />
    </>
  );
}
