import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGetExchangeRates, useGetGoldPrices } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, BarChart2, RefreshCw, Coins, Gem, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'wouter';
import { LiveBadge } from '@/components/live-badge';

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', TRY: '🇹🇷', GBP: '🇬🇧',
  AED: '🇦🇪', SAR: '🇸🇦', EGP: '🇪🇬', IQD: '🇮🇶', JOD: '🇯🇴',
  CNY: '🇨🇳', RUB: '🇷🇺', KWD: '🇰🇼',
};

const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'بيتكوين', nameEn: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH', name: 'إيثيريوم', nameEn: 'Ethereum', color: '#627EEA' },
  { id: 'tether', symbol: 'USDT', name: 'تيثر', nameEn: 'Tether', color: '#26A17B' },
  { id: 'binancecoin', symbol: 'BNB', name: 'باينانس', nameEn: 'BNB', color: '#F3BA2F' },
  { id: 'solana', symbol: 'SOL', name: 'سولانا', nameEn: 'Solana', color: '#9945FF' },
  { id: 'ripple', symbol: 'XRP', name: 'ريبل', nameEn: 'Ripple', color: '#00AAE4' },
];

const MAIN_CURRENCIES = ['USD', 'EUR', 'TRY', 'GBP', 'AED', 'SAR', 'EGP', 'IQD', 'JOD', 'CNY'];

interface CryptoData {
  symbol: string;
  name: string;
  nameEn: string;
  priceUSD: number;
  change24h: number;
  color: string;
}

export default function MarketPage() {
  const { data: ratesData, isLoading: loadingRates, refetch } = useGetExchangeRates();
  const { data: goldData, isLoading: loadingGold } = useGetGoldPrices();
  const { formatNum, t, language } = useApp();

  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const rates = ratesData?.rates ?? {};
  const usdToSyp = ratesData?.usd_to_syp ?? 13500;

  function getRateSYP(code: string): number {
    if (code === 'SYP') return 1;
    const codeRate = rates[code];
    const sypRate = rates['SYP'] ?? usdToSyp;
    if (!codeRate || !sypRate) return 0;
    return sypRate / codeRate;
  }

  useEffect(() => {
    const fetchCrypto = () => {
      const ids = CRYPTO_LIST.map(c => c.id).join(',');
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
        .then(r => r.json())
        .then((data: any) => {
          const result: CryptoData[] = CRYPTO_LIST.map(c => ({
            symbol: c.symbol,
            name: c.name,
            nameEn: c.nameEn,
            color: c.color,
            priceUSD: data[c.id]?.usd ?? 0,
            change24h: data[c.id]?.usd_24h_change ?? 0,
          })).filter(c => c.priceUSD > 0);
          setCryptoData(result);
          setLastUpdated(new Date());
        })
        .catch(() => {})
        .finally(() => setLoadingCrypto(false));
    };
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 60000);
    return () => clearInterval(interval);
  }, []);

  const chartData = MAIN_CURRENCIES
    .map(code => ({ code, rate: getRateSYP(code), flag: FLAG_MAP[code] ?? '🌍' }))
    .filter(d => d.rate > 0)
    .slice(0, 8);

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t('marketDashboard')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge />
          <button onClick={handleRefresh} className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground -mt-3">
        {t('lastUpdated')}: {lastUpdated.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {/* Global prices notice */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/20">
        <TrendingUpIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed flex-1">
          هذه الأسعار وفق الأسعار العالمية، لعرض الأسعار المحلية انتقل إلى قسم الصرافة.
        </span>
        <Link href="/app/home?cat=currency">
          <button className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-xl border border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-900/40 flex-shrink-0 hover:opacity-80 transition-opacity">
            <TrendingUpIcon className="w-3 h-3" /> الصرافة
          </button>
        </Link>
      </div>

      {/* USD/SYP Big Card */}
      {loadingRates ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <Link href="/app/currency/USD">
          <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform">
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-xs mb-1">🇺🇸 {language === 'ar' ? 'الدولار مقابل الليرة السورية' : 'USD vs Syrian Pound'}</p>
                  <div className="text-3xl font-bold">
                    {formatNum(usdToSyp, { decimals: 0 })} <span className="text-base font-normal opacity-80">ل.س</span>
                  </div>
                  <p className="text-[10px] text-primary-foreground/60 mt-1 flex items-center gap-1">
                    <img src="/syria-flag.png" alt="" className="w-4 h-4 rounded-full object-cover inline" /> {t('marketRate')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-foreground/60 text-xs">{language === 'ar' ? 'السعر / دولار' : 'Price / Dollar'}</p>
                  <p className="text-2xl font-bold mt-1">$1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Exchange Rates Chart */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">{language === 'ar' ? 'أسعار العملات الرئيسية مقابل الليرة (ل.س)' : 'Main Currency Rates vs SYP'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {loadingRates ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip
                  formatter={(v: any) => [`${formatNum(v, { decimals: 0 })} ل.س`, language === 'ar' ? 'السعر' : 'Price']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--primary) / ${0.5 + (i / chartData.length) * 0.5})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Currency Grid — clickable */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" /> {t('mainCurrencies')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {loadingRates
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            : MAIN_CURRENCIES.slice(0, 8).map(code => {
                const rate = getRateSYP(code);
                if (!rate) return null;
                return (
                  <Link key={code} href={`/app/currency/${code}`}>
                    <Card className="border-border shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.97] transition-all">
                      <CardContent className="p-3 flex items-center gap-2">
                        <span className="text-lg flex-shrink-0">{FLAG_MAP[code] ?? '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs" dir="ltr">{code}</p>
                          <p className="text-primary font-bold text-sm">
                            {formatNum(rate, { decimals: rate >= 100 ? 0 : 2 })} <span className="text-[9px] text-muted-foreground font-normal">ل.س</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* Gold Summary */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Gem className="w-4 h-4 text-yellow-500" /> {t('goldSummary')}
        </h3>
        {loadingGold ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : goldData ? (
          <Card className="border-yellow-200 dark:border-yellow-900/30 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {[24, 21, 18].map(karat => {
                  const k = (goldData.karats ?? []).find((k: any) => k.karat === karat);
                  if (!k) return null;
                  return (
                    <Link key={karat} href={`/app/gold/${karat}`}>
                      <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                        <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{language === 'ar' ? 'عيار' : 'K'}{karat}</p>
                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mt-1">
                          {formatNum(k.pricePerGramSYP, { decimals: 0 })}
                        </p>
                        <p className="text-[9px] text-yellow-600 dark:text-yellow-500">{t('pricePerGram')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-900/30 text-center">
                <p className="text-[10px] text-yellow-600">{t('intlOunce')}: ${formatNum(goldData.pricePerGramUSD * 31.1035, { decimals: 0 })}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Crypto Section */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span className="text-orange-500 font-bold text-base">₿</span> {t('digitalCurrencies')}
        </h3>
        {loadingCrypto ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : cryptoData.length > 0 ? (
          <div className="flex flex-col gap-2">
            {cryptoData.map(c => (
              <Card key={c.symbol} className="border-border shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.symbol.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{language === 'ar' ? c.name : c.nameEn}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{c.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" dir="ltr">${formatNum(c.priceUSD, { decimals: c.priceUSD > 1 ? 2 : 4 })}</p>
                    <div className={`flex items-center gap-0.5 justify-end text-[10px] font-bold ${c.change24h >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {language === 'ar' ? 'جارٍ تحميل أسعار الكريبتو...' : 'Loading crypto prices...'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
