import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';
export type NumberFormat = 'arabic' | 'english';

export interface CurrencyOverrideData {
  buyPrice?: number;
  sellPrice?: number;
}

interface AppContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  numberFormat: NumberFormat;
  setNumberFormat: (f: NumberFormat) => void;
  formatNum: (val: number, opts?: { decimals?: number; currency?: string }) => string;
  t: (key: string) => string;
  spread: number;
  getBuyRate: (rate: number) => number;
  getSellRate: (rate: number) => number;
  rateOverrides: Record<string, CurrencyOverrideData>;
  getCustomBuyRate: (code: string, midRate: number) => number;
  getCustomSellRate: (code: string, midRate: number) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  home:               { ar: 'الرئيسية',              en: 'Home' },
  currencies:         { ar: 'العملات',                en: 'Currencies' },
  metals:             { ar: 'المعادن',                en: 'Metals' },
  converter:          { ar: 'تحويل',                  en: 'Convert' },
  profile:            { ar: 'الملف الشخصي',           en: 'Profile' },
  language:           { ar: 'اللغة',                  en: 'Language' },
  arabic:             { ar: 'العربية',                en: 'Arabic' },
  english:            { ar: 'الإنجليزية',             en: 'English' },
  darkMode:           { ar: 'الوضع المظلم',           en: 'Dark Mode' },
  lightMode:          { ar: 'الوضع الفاتح',           en: 'Light Mode' },
  buy:                { ar: 'شراء',                   en: 'Buy' },
  sell:               { ar: 'بيع',                    en: 'Sell' },
  alert:              { ar: 'تنبيه',                  en: 'Alert' },
  live:               { ar: 'مباشر',                  en: 'Live' },
  exchangeRates:      { ar: 'أسعار الصرف الرئيسية',  en: 'Main Exchange Rates' },
  goldPrices:         { ar: 'أسعار الذهب',            en: 'Gold Prices' },
  latestNews:         { ar: 'أحدث الأخبار',           en: 'Latest News' },
  searchNews:         { ar: 'ابحث عن الأخبار...',    en: 'Search news...' },
  priceAlert:         { ar: 'تنبيه السعر',            en: 'Price Alert' },
  priceAlerts:        { ar: 'إدارة التنبيهات',        en: 'Price Alerts' },
  targetPrice:        { ar: 'السعر المستهدف',         en: 'Target Price' },
  createAlert:        { ar: 'إنشاء تنبيه',            en: 'Create Alert' },
  currentPrice:       { ar: 'السعر الحالي',           en: 'Current Price' },
  priceType:          { ar: 'نوع السعر للمراقبة',     en: 'Price Type to Watch' },
  buyPrice:           { ar: 'سعر الشراء',             en: 'Buy Price' },
  sellPrice:          { ar: 'سعر البيع',              en: 'Sell Price' },
  wallet:             { ar: 'محفظتي وممتلكاتي',       en: 'My Wallet & Holdings' },
  addHolding:         { ar: 'إضافة',                  en: 'Add' },
  currency:           { ar: 'عملة',                   en: 'Currency' },
  gold:               { ar: 'ذهب',                    en: 'Gold' },
  crypto:             { ar: 'كريبتو',                 en: 'Crypto' },
  weight:             { ar: 'الوزن (غرام)',            en: 'Weight (gram)' },
  quantity:           { ar: 'الكمية',                 en: 'Quantity' },
  amount:             { ar: 'المبلغ',                 en: 'Amount' },
  add:                { ar: 'إضافة',                  en: 'Add' },
  cancel:             { ar: 'إلغاء',                  en: 'Cancel' },
  myHoldings:         { ar: 'ممتلكاتي',               en: 'My Holdings' },
  numberFormat:       { ar: 'عرض الأرقام',            en: 'Number Format' },
  arabicNums:         { ar: 'أرقام عربية',            en: 'Arabic Numerals' },
  englishNums:        { ar: 'أرقام إنجليزية',         en: 'English Numerals' },
  privacy:            { ar: 'سياسة الخصوصية',         en: 'Privacy Policy' },
  about:              { ar: 'حول التطبيق',            en: 'About App' },
  signOut:            { ar: 'تسجيل الخروج',           en: 'Sign Out' },
  signIn:             { ar: 'تسجيل الدخول',           en: 'Sign In' },
  signUp:             { ar: 'إنشاء حساب',             en: 'Sign Up' },
  guestMode:          { ar: 'المتابعة كضيف',          en: 'Continue as Guest' },
  welcome:            { ar: 'أهلاً بك في LiraPro',   en: 'Welcome to LiraPro' },
  welcomeSubtitle:    { ar: 'منصتك الذكية المتكاملة لمتابعة أسعار الصرف الحية والذهب والمعادن والسلع المحلية لحظة بلحظة', en: 'Your smart platform for live exchange rates, gold, metals & local market prices in real time' },
  welcomeSubtitle2:   { ar: 'واستكشاف الخدمات المحلية والدفع والشراء عبر الإنترنت مع إدارة رصيدك بسهولة وأمان', en: 'Explore local services, pay bills & shop online while managing your balance safely' },
  servicesBalance:    { ar: 'الخدمات والرصيد',         en: 'Services & Balance' },
  servicesSubtitle:   { ar: 'إدارة حسابك وخدماتك المحلية', en: 'Manage your account & local services' },
  convertCurrencies:  { ar: 'تحويل العملات',          en: 'Convert Currencies' },
  goldCalculator:     { ar: 'حاسبة الذهب',            en: 'Gold Calculator' },
  preciousMetals:     { ar: 'أسعار المعادن الثمينة',  en: 'Precious Metal Prices' },
  from:               { ar: 'من',                     en: 'From' },
  to:                 { ar: 'إلى',                    en: 'To' },
  daily:              { ar: 'يومي',                   en: 'Daily' },
  weekly:             { ar: 'أسبوعي',                 en: 'Weekly' },
  monthly:            { ar: 'شهري',                   en: 'Monthly' },
  karat:              { ar: 'عيار',                   en: 'Karat' },
  perGram:            { ar: 'لكل غرام',               en: 'Per Gram' },
  market:             { ar: 'لوحة السوق',             en: 'Market' },
  marketDashboard:    { ar: 'لوحة تحكم السوق',        en: 'Market Dashboard' },
  cryptoCurrencies:   { ar: 'العملات المشفرة',         en: 'Cryptocurrencies' },
  lastUpdated:        { ar: 'آخر تحديث',              en: 'Last updated' },
  noData:             { ar: 'لا تتوفر بيانات',        en: 'No data available' },
  loading:            { ar: 'جارٍ التحميل...',        en: 'Loading...' },
  search:             { ar: 'ابحث...',                en: 'Search...' },
  searchCurrency:     { ar: 'ابحث عن عملة...',        en: 'Search currency...' },
  refresh:            { ar: 'تحديث',                  en: 'Refresh' },
  back:               { ar: 'رجوع',                   en: 'Back' },
  mainCurrencies:     { ar: 'العملات الرئيسية',       en: 'Main Currencies' },
  goldSummary:        { ar: 'ملخص الذهب',             en: 'Gold Summary' },
  digitalCurrencies:  { ar: 'العملات الرقمية',        en: 'Digital Currencies' },
  pricePerGram:       { ar: 'السعر/غرام',             en: 'Price/gram' },
  intlOunce:          { ar: 'سعر الأوقية الدولية',   en: 'International ounce price' },
  allPricesLive:      { ar: 'جميع الأسعار مباشرة بالسعر السوقي', en: 'All prices are live market prices' },
  clickForDetails:    { ar: 'اضغط على أي معدن لعرض التفاصيل', en: 'Tap any metal for details' },
  chooseCurrency:     { ar: 'اختر عملة',              en: 'Choose Currency' },
  mostUsed:           { ar: 'الأكثر استخداماً',       en: 'Most Used' },
  pinned:             { ar: 'مثبّت',                  en: 'Pinned' },
  buySellRate:        { ar: 'سعر {mode}',             en: '{mode} rate' },
  enterAmount:        { ar: 'أدخل مبلغاً للتحويل',   en: 'Enter amount to convert' },
  syrianPound:        { ar: 'ليرة سورية',             en: 'Syrian Pound' },
  usDollar:           { ar: 'دولار أمريكي',           en: 'US Dollar' },
  chartHistory:       { ar: 'الرسم البياني',          en: 'Chart' },
  alertCreated:       { ar: 'تم إنشاء التنبيه بنجاح!', en: 'Alert created successfully!' },
  marketRate:         { ar: 'السعر السوقي',           en: 'Market Rate' },
  notifications:      { ar: 'الإشعارات',              en: 'Notifications' },
  noNotifications:    { ar: 'لا توجد إشعارات',       en: 'No notifications' },
  aboutUs:            { ar: 'من نحن',                 en: 'About Us' },
  keyFeatures:        { ar: 'المزايا الرئيسية',       en: 'Key Features' },
  aboutApp:           { ar: 'حول التطبيق',            en: 'About the App' },
  version:            { ar: 'الإصدار',                en: 'Version' },
  madeWith:           { ar: 'صُنع بـ ❤️ لخدمة المجتمع السوري · جميع الحقوق محفوظة © 2026', en: 'Made with ❤️ for the Syrian community · All rights reserved © 2026' },
  settings:           { ar: 'الإعدادات',              en: 'Settings' },
  currenciesList:     { ar: 'قائمة العملات',           en: 'Currencies List' },
  marketClosed:       { ar: 'السوق مغلق',              en: 'Market Closed' },
  support:            { ar: 'الدعم الفني',             en: 'Support' },
  faq:                { ar: 'الأسئلة الشائعة',         en: 'FAQ' },
  membership:         { ar: 'العضوية',                 en: 'Membership' },
  sendMessage:        { ar: 'إرسال رسالة',             en: 'Send Message' },
  closeTicket:        { ar: 'إغلاق التذكرة',           en: 'Close Ticket' },
  localPrice:         { ar: 'السعر المحلي',            en: 'Local Price' },
  globalPrice:        { ar: 'السعر العالمي',           en: 'Global Price' },
  scanQR:             { ar: 'مسح QR',                  en: 'Scan QR' },
  myQR:               { ar: 'رمز QR الخاص بي',        en: 'My QR Code' },
  sessions:           { ar: 'جلسات الجهاز',            en: 'Device Sessions' },
  devices:            { ar: 'أجهزتي',                  en: 'My Devices' },
  province:           { ar: 'المحافظة',                en: 'Province' },
  city:               { ar: 'المدينة',                 en: 'City' },
  phone:              { ar: 'الهاتف',                  en: 'Phone' },
  online:             { ar: 'متصل',                    en: 'Online' },
  offline:            { ar: 'غير متصل',                en: 'Offline' },
  banned:             { ar: 'محظور',                   en: 'Banned' },
  verified:           { ar: 'موثّق',                   en: 'Verified' },
  personalAccount:    { ar: 'حساب شخصي',               en: 'Personal Account' },
  businessAccount:    { ar: 'حساب تجاري',              en: 'Business Account' },
  lastSeen:           { ar: 'آخر ظهور',                en: 'Last Seen' },
  joinedAt:           { ar: 'تاريخ التسجيل',           en: 'Joined' },
  deleteAccount:      { ar: 'حذف الحساب',              en: 'Delete Account' },
  changePassword:     { ar: 'تغيير كلمة المرور',       en: 'Change Password' },
  editProfile:        { ar: 'تعديل الملف الشخصي',     en: 'Edit Profile' },
  save:               { ar: 'حفظ',                     en: 'Save' },
  saved:              { ar: 'تم الحفظ',                en: 'Saved' },
  confirm:            { ar: 'تأكيد',                   en: 'Confirm' },
  close:              { ar: 'إغلاق',                   en: 'Close' },
  delete:             { ar: 'حذف',                     en: 'Delete' },
  report:             { ar: 'إبلاغ',                   en: 'Report' },
  share:              { ar: 'مشاركة',                  en: 'Share' },
  copy:               { ar: 'نسخ',                     en: 'Copy' },
  copied:             { ar: 'تم النسخ',                en: 'Copied' },
  error:              { ar: 'حدث خطأ',                 en: 'An error occurred' },
  tryAgain:           { ar: 'حاول مجدداً',             en: 'Try Again' },
  success:            { ar: 'نجاح',                    en: 'Success' },
  warning:            { ar: 'تحذير',                   en: 'Warning' },
  info:               { ar: 'معلومة',                  en: 'Info' },
  selectAll:          { ar: 'تحديد الكل',              en: 'Select All' },
  deselectAll:        { ar: 'إلغاء الكل',              en: 'Deselect All' },
  deleteSelected:     { ar: 'حذف المحدد',              en: 'Delete Selected' },
  selectMode:         { ar: 'وضع التحديد',             en: 'Selection Mode' },
  noResults:          { ar: 'لا توجد نتائج',           en: 'No results' },
  filterBy:           { ar: 'تصفية حسب',               en: 'Filter by' },
  sortBy:             { ar: 'ترتيب حسب',               en: 'Sort by' },
  all:                { ar: 'الكل',                    en: 'All' },
  pending:            { ar: 'معلق',                    en: 'Pending' },
  approved:           { ar: 'مقبول',                   en: 'Approved' },
  rejected:           { ar: 'مرفوض',                   en: 'Rejected' },
  handled:            { ar: 'مُعالَج',                 en: 'Handled' },
  open:               { ar: 'مفتوح',                   en: 'Open' },
  closed:             { ar: 'مغلق',                    en: 'Closed' },
  vendor:             { ar: 'تاجر',                    en: 'Vendor' },
  admin:              { ar: 'مشرف',                    en: 'Admin' },
  user:               { ar: 'مستخدم',                  en: 'User' },
  trustScore:         { ar: 'نسبة الموثوقية',          en: 'Trust Score' },
  rating:             { ar: 'التقييم',                 en: 'Rating' },
  reports:            { ar: 'البلاغات',                en: 'Reports' },
  active:             { ar: 'نشط',                     en: 'Active' },
  inactive:           { ar: 'غير نشط',                 en: 'Inactive' },
  legendary:          { ar: 'أسطوري',                  en: 'Legendary' },
  cyberpunk:          { ar: 'سايبربانك',               en: 'Cyberpunk' },
  qrLogin:            { ar: 'تسجيل دخول بـ QR',       en: 'QR Login' },
  confirmQrLogin:     { ar: 'تأكيد تسجيل الدخول',     en: 'Confirm QR Login' },
  qrLoginDesc:        { ar: 'تم كشف رمز QR. هل تريد تسجيل هذا الجهاز؟', en: 'QR code detected. Register this device?' },
};

function toArabicNumerals(str: string): string {
  return str.replace(/[0-9]/g, d => String.fromCharCode(0x0660 + parseInt(d)));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('syp-lang') as Language) || 'ar';
  });
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>(() => {
    return (localStorage.getItem('syp-numfmt') as NumberFormat) || 'arabic';
  });

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('syp-lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  };

  const setNumberFormat = (f: NumberFormat) => {
    setNumberFormatState(f);
    localStorage.setItem('syp-numfmt', f);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const formatNum = (val: number, opts?: { decimals?: number; currency?: string }) => {
    const d = opts?.decimals ?? (opts?.currency === 'SYP' ? 0 : 2);
    const raw = val.toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    return numberFormat === 'arabic' ? toArabicNumerals(raw) : raw;
  };

  const t = (key: string): string => {
    return TRANSLATIONS[key]?.[language] ?? key;
  };

  const [rateOverrides, setRateOverrides] = useState<Record<string, CurrencyOverrideData>>({});

  useEffect(() => {
    fetch('/api/admin/rate-overrides')
      .then(r => r.ok ? r.json() : Promise.resolve({}))
      .then((data: Record<string, { buyPrice?: number; sellPrice?: number }>) => {
        const cleaned: Record<string, CurrencyOverrideData> = {};
        Object.entries(data).forEach(([k, v]) => {
          cleaned[k] = { buyPrice: v.buyPrice, sellPrice: v.sellPrice };
        });
        setRateOverrides(cleaned);
      })
      .catch(() => {});
  }, []);

  const spread = 0.015;
  const getBuyRate = (rate: number) => rate * (1 + spread);
  const getSellRate = (rate: number) => rate * (1 - spread);

  const getCustomBuyRate = (code: string, midRate: number) => {
    const ov = rateOverrides[code];
    return ov?.buyPrice ?? getBuyRate(midRate);
  };

  const getCustomSellRate = (code: string, midRate: number) => {
    const ov = rateOverrides[code];
    return ov?.sellPrice ?? getSellRate(midRate);
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      numberFormat, setNumberFormat,
      formatNum, t,
      spread, getBuyRate, getSellRate,
      rateOverrides, getCustomBuyRate, getCustomSellRate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
