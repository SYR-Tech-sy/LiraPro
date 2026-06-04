import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Flame, ShoppingBasket, Building2, Monitor, Car, Home, Package,
  Globe, TrendingUp, TrendingDown, Minus, Search, X, AlertCircle, Bell,
  ChevronLeft, BarChart2, MapPin, ChevronDown, Navigation, Loader2,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from 'wouter';

const SYRIAN_GOVERNORATES = [
  'إدلب','دمشق','ريف دمشق','حلب','حمص','حماة',
  'اللاذقية','طرطوس','دير الزور','الرقة','الحسكة','السويداء','درعا','القنيطرة',
];

interface Commodity {
  nameAr: string;
  nameEn: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  trend: 'up' | 'down' | 'stable';
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  commodities: Commodity[];
}

function fmtSYP(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} م`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} ك`;
  return n.toLocaleString();
}

function generateChartData(minPrice: number, maxPrice: number): { day: string; price: number }[] {
  const mid = (minPrice + maxPrice) / 2;
  const range = (maxPrice - minPrice) / 2;
  const days = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
  let prev = mid;
  return days.map((day, i) => {
    const noise = (Math.sin(i * 1.7 + 0.5) * range * 0.4) + (Math.cos(i * 0.9) * range * 0.2);
    prev = Math.round(Math.max(minPrice * 0.92, Math.min(maxPrice * 1.08, prev + noise)));
    return { day, price: prev };
  });
}

const CATEGORIES: Category[] = [
  {
    id: 'agriculture', nameAr: 'المحاصيل الزراعية', nameEn: 'Agricultural Crops',
    icon: Sprout, color: '#16a34a', bg: '#f0fdf4',
    commodities: [
      { nameAr: 'قمح', nameEn: 'Wheat', unit: 'طن', minPrice: 400000, maxPrice: 550000, trend: 'up' },
      { nameAr: 'شعير', nameEn: 'Barley', unit: 'طن', minPrice: 350000, maxPrice: 450000, trend: 'stable' },
      { nameAr: 'ذرة', nameEn: 'Corn', unit: 'طن', minPrice: 380000, maxPrice: 500000, trend: 'up' },
      { nameAr: 'أرز', nameEn: 'Rice', unit: 'طن', minPrice: 1800000, maxPrice: 2600000, trend: 'stable' },
      { nameAr: 'زيتون', nameEn: 'Olives', unit: 'طن', minPrice: 1500000, maxPrice: 2500000, trend: 'up' },
      { nameAr: 'قطن', nameEn: 'Cotton', unit: 'طن', minPrice: 500000, maxPrice: 700000, trend: 'up' },
      { nameAr: 'سمسم', nameEn: 'Sesame', unit: 'طن', minPrice: 2000000, maxPrice: 3200000, trend: 'up' },
      { nameAr: 'حبة السوداء', nameEn: 'Black Seed', unit: 'طن', minPrice: 3000000, maxPrice: 5000000, trend: 'up' },
      { nameAr: 'كمون', nameEn: 'Cumin', unit: 'طن', minPrice: 5000000, maxPrice: 9000000, trend: 'stable' },
      { nameAr: 'كزبرة', nameEn: 'Coriander', unit: 'طن', minPrice: 2000000, maxPrice: 3500000, trend: 'stable' },
      { nameAr: 'يانسون', nameEn: 'Anise', unit: 'طن', minPrice: 3000000, maxPrice: 5000000, trend: 'up' },
      { nameAr: 'حمص', nameEn: 'Chickpeas', unit: 'طن', minPrice: 1500000, maxPrice: 2500000, trend: 'stable' },
      { nameAr: 'عدس', nameEn: 'Lentils', unit: 'طن', minPrice: 1800000, maxPrice: 2800000, trend: 'up' },
      { nameAr: 'فول', nameEn: 'Fava Beans', unit: 'طن', minPrice: 1200000, maxPrice: 2000000, trend: 'stable' },
      { nameAr: 'صويا', nameEn: 'Soybean', unit: 'طن', minPrice: 900000, maxPrice: 1500000, trend: 'stable' },
      { nameAr: 'خردل', nameEn: 'Mustard', unit: 'طن', minPrice: 2000000, maxPrice: 3500000, trend: 'stable' },
      { nameAr: 'شمر', nameEn: 'Fennel', unit: 'طن', minPrice: 2500000, maxPrice: 4500000, trend: 'up' },
      { nameAr: 'زعتر', nameEn: 'Thyme', unit: 'طن', minPrice: 3000000, maxPrice: 5500000, trend: 'up' },
      { nameAr: 'ورد جوري', nameEn: 'Damask Rose', unit: 'طن', minPrice: 8000000, maxPrice: 15000000, trend: 'up' },
      { nameAr: 'قرفة', nameEn: 'Cinnamon', unit: 'طن', minPrice: 7000000, maxPrice: 12000000, trend: 'stable' },
      { nameAr: 'فلفل أحمر', nameEn: 'Red Pepper', unit: 'طن', minPrice: 3000000, maxPrice: 5500000, trend: 'up' },
    ],
  },
  {
    id: 'fuel', nameAr: 'الوقود والطاقة', nameEn: 'Fuel & Energy',
    icon: Flame, color: '#ea580c', bg: '#fff7ed',
    commodities: [
      { nameAr: 'بنزين 90', nameEn: 'Gasoline 90', unit: 'لتر', minPrice: 8000, maxPrice: 8000, trend: 'stable' },
      { nameAr: 'بنزين 95', nameEn: 'Gasoline 95', unit: 'لتر', minPrice: 10000, maxPrice: 10000, trend: 'stable' },
      { nameAr: 'مازوت', nameEn: 'Diesel', unit: 'لتر', minPrice: 5500, maxPrice: 7000, trend: 'up' },
      { nameAr: 'اسطوانة الغاز', nameEn: 'Gas Cylinder', unit: 'اسطوانة', minPrice: 35000, maxPrice: 55000, trend: 'up' },
      { nameAr: 'كهرباء', nameEn: 'Electricity', unit: 'ك.و/س', minPrice: 500, maxPrice: 900, trend: 'stable' },
      { nameAr: 'فحم', nameEn: 'Coal', unit: 'كغ', minPrice: 4000, maxPrice: 7000, trend: 'stable' },
      { nameAr: 'حطب', nameEn: 'Firewood', unit: 'طن', minPrice: 200000, maxPrice: 350000, trend: 'up' },
      { nameAr: 'قشر فستق', nameEn: 'Pistachio Shells', unit: 'طن', minPrice: 150000, maxPrice: 280000, trend: 'stable' },
      { nameAr: 'نشارة مضغوطة', nameEn: 'Compressed Sawdust', unit: 'طن', minPrice: 180000, maxPrice: 300000, trend: 'up' },
    ],
  },
  {
    id: 'food', nameAr: 'الأغذية', nameEn: 'Food',
    icon: ShoppingBasket, color: '#d97706', bg: '#fffbeb',
    commodities: [
      { nameAr: 'دقيق أبيض', nameEn: 'White Flour', unit: 'كغ', minPrice: 3000, maxPrice: 5000, trend: 'stable' },
      { nameAr: 'سكر', nameEn: 'Sugar', unit: 'كغ', minPrice: 10000, maxPrice: 15000, trend: 'up' },
      { nameAr: 'زيت نباتي', nameEn: 'Vegetable Oil', unit: 'لتر', minPrice: 18000, maxPrice: 25000, trend: 'stable' },
      { nameAr: 'شاي 500غ', nameEn: 'Tea 500g', unit: 'علبة', minPrice: 40000, maxPrice: 65000, trend: 'up' },
      { nameAr: 'قهوة', nameEn: 'Coffee', unit: 'كغ', minPrice: 80000, maxPrice: 130000, trend: 'up' },
      { nameAr: 'لحم غنم', nameEn: 'Lamb', unit: 'كغ', minPrice: 150000, maxPrice: 200000, trend: 'up' },
      { nameAr: 'لحم بقر', nameEn: 'Beef', unit: 'كغ', minPrice: 130000, maxPrice: 180000, trend: 'up' },
      { nameAr: 'دجاج', nameEn: 'Chicken', unit: 'كغ', minPrice: 45000, maxPrice: 65000, trend: 'up' },
      { nameAr: 'سمك', nameEn: 'Fish', unit: 'كغ', minPrice: 60000, maxPrice: 100000, trend: 'stable' },
    ],
  },
  {
    id: 'construction', nameAr: 'البناء', nameEn: 'Construction',
    icon: Building2, color: '#7c3aed', bg: '#faf5ff',
    commodities: [
      { nameAr: 'اسمنت 50كغ', nameEn: 'Cement 50kg', unit: 'كيس', minPrice: 55000, maxPrice: 80000, trend: 'up' },
      { nameAr: 'حديد تسليح', nameEn: 'Steel Rebar', unit: 'طن', minPrice: 2500000, maxPrice: 3500000, trend: 'down' },
      { nameAr: 'خفاف/بلوك', nameEn: 'Block/Hollow Brick', unit: '1000 قطعة', minPrice: 350000, maxPrice: 550000, trend: 'stable' },
      { nameAr: 'نحاتة/رمل', nameEn: 'Sand/Gravel Mix', unit: 'م³', minPrice: 120000, maxPrice: 200000, trend: 'stable' },
      { nameAr: 'حصى', nameEn: 'Gravel', unit: 'م³', minPrice: 150000, maxPrice: 220000, trend: 'stable' },
      { nameAr: 'جبص 40كغ', nameEn: 'Plaster 40kg', unit: 'كيس', minPrice: 40000, maxPrice: 65000, trend: 'up' },
      { nameAr: 'زجاج', nameEn: 'Glass', unit: 'م²', minPrice: 80000, maxPrice: 150000, trend: 'up' },
      { nameAr: 'بلاط سيراميك', nameEn: 'Ceramic Tiles', unit: 'م²', minPrice: 90000, maxPrice: 200000, trend: 'stable' },
      { nameAr: 'دهان داخلي', nameEn: 'Interior Paint', unit: 'لتر', minPrice: 30000, maxPrice: 60000, trend: 'stable' },
      { nameAr: 'غرانيت', nameEn: 'Granite', unit: 'م²', minPrice: 200000, maxPrice: 450000, trend: 'up' },
      { nameAr: 'حجر تلبيس', nameEn: 'Cladding Stone', unit: 'م²', minPrice: 150000, maxPrice: 350000, trend: 'stable' },
      { nameAr: 'ألمنيوم', nameEn: 'Aluminum', unit: 'كغ', minPrice: 45000, maxPrice: 75000, trend: 'up' },
    ],
  },
  {
    id: 'electronics', nameAr: 'الإلكترونيات', nameEn: 'Electronics',
    icon: Monitor, color: '#0891b2', bg: '#ecfeff',
    commodities: [
      { nameAr: 'هاتف ذكي', nameEn: 'Smartphone', unit: 'جهاز', minPrice: 2500000, maxPrice: 6000000, trend: 'up' },
      { nameAr: 'لابتوب', nameEn: 'Laptop', unit: 'جهاز', minPrice: 5000000, maxPrice: 10000000, trend: 'up' },
      { nameAr: 'تلفزيون 50"', nameEn: 'TV 50"', unit: 'جهاز', minPrice: 4000000, maxPrice: 8000000, trend: 'stable' },
      { nameAr: 'ثلاجة عائلية', nameEn: 'Refrigerator', unit: 'جهاز', minPrice: 3500000, maxPrice: 7000000, trend: 'stable' },
      { nameAr: 'غسالة أوتوماتيك', nameEn: 'Washing Machine', unit: 'جهاز', minPrice: 2000000, maxPrice: 5000000, trend: 'up' },
      { nameAr: 'مكيف 1.5 حصان', nameEn: 'AC Unit 1.5HP', unit: 'جهاز', minPrice: 3000000, maxPrice: 6000000, trend: 'up' },
      { nameAr: 'فرن غاز', nameEn: 'Gas Oven', unit: 'جهاز', minPrice: 1200000, maxPrice: 2500000, trend: 'stable' },
      { nameAr: 'سماعات بلوتوث', nameEn: 'BT Headphones', unit: 'جهاز', minPrice: 400000, maxPrice: 1500000, trend: 'stable' },
    ],
  },
  {
    id: 'vehicles', nameAr: 'السيارات', nameEn: 'Vehicles',
    icon: Car, color: '#dc2626', bg: '#fef2f2',
    commodities: [
      { nameAr: 'سيارة مستعملة', nameEn: 'Used Economy Car', unit: 'سيارة', minPrice: 50000000, maxPrice: 150000000, trend: 'up' },
      { nameAr: 'دراجة نارية', nameEn: 'Motorcycle', unit: 'دراجة', minPrice: 8000000, maxPrice: 25000000, trend: 'stable' },
      { nameAr: 'إطارات 4 قطع', nameEn: 'Tires (Set of 4)', unit: 'مجموعة', minPrice: 2000000, maxPrice: 5000000, trend: 'up' },
      { nameAr: 'زيت محرك 5ل', nameEn: 'Engine Oil 5L', unit: 'عبوة', minPrice: 250000, maxPrice: 450000, trend: 'up' },
      { nameAr: 'بطارية سيارة', nameEn: 'Car Battery', unit: 'بطارية', minPrice: 500000, maxPrice: 1000000, trend: 'stable' },
      { nameAr: 'تصليح إطار', nameEn: 'Tire Repair', unit: 'خدمة', minPrice: 15000, maxPrice: 30000, trend: 'stable' },
      { nameAr: 'صيانة دورية', nameEn: 'Routine Maintenance', unit: 'خدمة', minPrice: 200000, maxPrice: 500000, trend: 'stable' },
    ],
  },
  {
    id: 'realestate', nameAr: 'العقارات', nameEn: 'Real Estate',
    icon: Home, color: '#0284c7', bg: '#f0f9ff',
    commodities: [
      { nameAr: 'شقة للبيع (ريف دمشق)', nameEn: 'Apartment For Sale', unit: 'شقة', minPrice: 40000000, maxPrice: 80000000, trend: 'up' },
      { nameAr: 'شقة للإيجار (دمشق)', nameEn: 'Apartment For Rent', unit: 'شهرياً', minPrice: 500000, maxPrice: 2000000, trend: 'up' },
      { nameAr: 'محل تجاري للإيجار', nameEn: 'Shop For Rent', unit: 'شهرياً', minPrice: 1000000, maxPrice: 5000000, trend: 'up' },
      { nameAr: 'أرض زراعية (دونم)', nameEn: 'Agricultural Land', unit: 'دونم', minPrice: 10000000, maxPrice: 30000000, trend: 'stable' },
      { nameAr: 'مكتب للإيجار', nameEn: 'Office For Rent', unit: 'شهرياً', minPrice: 800000, maxPrice: 3000000, trend: 'up' },
      { nameAr: 'مستودع للإيجار', nameEn: 'Warehouse Rental', unit: 'شهرياً', minPrice: 500000, maxPrice: 2500000, trend: 'stable' },
      { nameAr: 'استوديو للإيجار', nameEn: 'Studio For Rent', unit: 'شهرياً', minPrice: 300000, maxPrice: 800000, trend: 'stable' },
    ],
  },
  {
    id: 'shipping', nameAr: 'الشحن', nameEn: 'Shipping & Transport',
    icon: Package, color: '#0f766e', bg: '#f0fdfa',
    commodities: [
      { nameAr: 'شحن داخلي 5كغ', nameEn: 'Local Shipping 5kg', unit: 'طرد', minPrice: 5000, maxPrice: 15000, trend: 'stable' },
      { nameAr: 'شحن بين محافظات', nameEn: 'Inter-city Shipping', unit: 'طرد', minPrice: 8000, maxPrice: 20000, trend: 'up' },
      { nameAr: 'شحن دولي', nameEn: 'International Shipping', unit: 'كغ', minPrice: 80000, maxPrice: 200000, trend: 'up' },
      { nameAr: 'نقل أثاث', nameEn: 'Furniture Moving', unit: 'خدمة', minPrice: 200000, maxPrice: 500000, trend: 'stable' },
      { nameAr: 'شحن سريع', nameEn: 'Express Delivery', unit: 'خدمة', minPrice: 15000, maxPrice: 40000, trend: 'stable' },
      { nameAr: 'تأجير شاحنة', nameEn: 'Truck Rental', unit: 'يوم', minPrice: 100000, maxPrice: 250000, trend: 'stable' },
      { nameAr: 'نقل مواد بناء', nameEn: 'Materials Transport', unit: 'حمولة', minPrice: 150000, maxPrice: 400000, trend: 'stable' },
    ],
  },
  {
    id: 'digital', nameAr: 'الخدمات الرقمية', nameEn: 'Digital Services',
    icon: Globe, color: '#6d28d9', bg: '#faf5ff',
    commodities: [
      { nameAr: 'إنترنت منزلي', nameEn: 'Home Internet', unit: 'شهرياً', minPrice: 80000, maxPrice: 250000, trend: 'up' },
      { nameAr: 'VPN', nameEn: 'VPN Service', unit: 'شهرياً', minPrice: 30000, maxPrice: 80000, trend: 'stable' },
      { nameAr: 'استضافة ويب', nameEn: 'Web Hosting', unit: 'شهرياً', minPrice: 20000, maxPrice: 100000, trend: 'stable' },
      { nameAr: 'تصميم موقع', nameEn: 'Website Design', unit: 'مشروع', minPrice: 1000000, maxPrice: 5000000, trend: 'stable' },
      { nameAr: 'إدارة سوشيال ميديا', nameEn: 'Social Media Mgmt', unit: 'شهرياً', minPrice: 200000, maxPrice: 800000, trend: 'up' },
      { nameAr: 'تصميم شعار', nameEn: 'Logo Design', unit: 'مشروع', minPrice: 300000, maxPrice: 1500000, trend: 'stable' },
      { nameAr: 'تطوير تطبيق', nameEn: 'App Development', unit: 'ساعة', minPrice: 100000, maxPrice: 300000, trend: 'up' },
      { nameAr: 'خدمات SEO', nameEn: 'SEO Services', unit: 'شهرياً', minPrice: 300000, maxPrice: 1000000, trend: 'stable' },
    ],
  },
];

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return (
    <div className="flex items-center gap-0.5">
      <TrendingUp style={{ width: 11, height: 11, color: '#16a34a' }} />
      <span className="text-[9px] text-green-600 font-bold">ارتفاع</span>
    </div>
  );
  if (trend === 'down') return (
    <div className="flex items-center gap-0.5">
      <TrendingDown style={{ width: 11, height: 11, color: '#dc2626' }} />
      <span className="text-[9px] text-red-600 font-bold">انخفاض</span>
    </div>
  );
  return (
    <div className="flex items-center gap-0.5">
      <Minus style={{ width: 11, height: 11, color: '#6b7280' }} />
      <span className="text-[9px] text-muted-foreground font-bold">مستقر</span>
    </div>
  );
}

interface DetailModalProps {
  commodity: Commodity;
  category: Category;
  onClose: () => void;
  onAddAlert: () => void;
}

function DetailModal({ commodity, category, onClose, onAddAlert }: DetailModalProps) {
  const chartData = useMemo(() => generateChartData(commodity.minPrice, commodity.maxPrice), [commodity]);
  const mid = Math.round((commodity.minPrice + commodity.maxPrice) / 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-3xl pb-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: category.bg }}>
              <category.icon style={{ width: 20, height: 20, color: category.color }} />
            </div>
            <div>
              <h2 className="font-black text-base">{commodity.nameAr}</h2>
              <p className="text-[11px] text-muted-foreground">{commodity.nameEn} · لكل {commodity.unit}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Price Summary */}
        <div className="mx-5 mb-4 grid grid-cols-3 gap-2">
          <div className="bg-secondary/60 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground mb-1">أدنى سعر</p>
            <p className="text-sm font-black tabular-nums" style={{ color: category.color }} dir="ltr">
              {fmtSYP(commodity.minPrice)}
            </p>
            <p className="text-[9px] text-muted-foreground">ل.س</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: category.color + '15' }}>
            <p className="text-[9px] text-muted-foreground mb-1">متوسط</p>
            <p className="text-base font-black tabular-nums" style={{ color: category.color }} dir="ltr">
              {fmtSYP(mid)}
            </p>
            <p className="text-[9px] text-muted-foreground">ل.س</p>
          </div>
          <div className="bg-secondary/60 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground mb-1">أعلى سعر</p>
            <p className="text-sm font-black tabular-nums" style={{ color: category.color }} dir="ltr">
              {fmtSYP(commodity.maxPrice)}
            </p>
            <p className="text-[9px] text-muted-foreground">ل.س</p>
          </div>
        </div>

        {/* Chart */}
        <div className="mx-5 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 className="w-3.5 h-3.5" style={{ color: category.color }} />
            <span className="text-xs font-bold text-muted-foreground">تحرك السعر - 14 يوم</span>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={category.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={category.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v: number) => [`${fmtSYP(v)} ل.س`, 'السعر']}
                  labelFormatter={(l) => `يوم ${l}`}
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={category.color}
                  strokeWidth={2}
                  fill="url(#chartGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: category.color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend */}
        <div className="mx-5 mb-4 flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
          <TrendBadge trend={commodity.trend} />
          <span className="text-xs text-muted-foreground">
            الاتجاه الحالي: {commodity.trend === 'up' ? 'ارتفاع' : commodity.trend === 'down' ? 'انخفاض' : 'مستقر'}
          </span>
        </div>

        {/* Actions */}
        <div className="mx-5 flex gap-2">
          <button
            onClick={onAddAlert}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: category.color }}
          >
            <Bell className="w-4 h-4" />
            إضافة تنبيه سعري
          </button>
          <button
            onClick={onClose}
            className="h-12 px-4 rounded-2xl font-bold text-sm border border-border hover:bg-secondary transition-colors"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketEconomyPage() {
  const { language } = useApp();
  const ar = language === 'ar';
  const [, navigate] = useLocation();
  const [activeCat, setActiveCat] = useState('agriculture');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ commodity: Commodity; category: Category } | null>(null);

  // ── Governorate filter state ──────────────────────────────────────────────
  const [selectedGov, setSelectedGov] = useState('');
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const category = useMemo(() => CATEGORIES.find(c => c.id === activeCat)!, [activeCat]);

  const filtered = useMemo(() => {
    if (!search.trim()) return category.commodities;
    const q = search.toLowerCase();
    return category.commodities.filter(c =>
      c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
    );
  }, [category, search]);

  const handleAddAlert = useCallback(() => {
    setSelected(null);
    navigate('/app/alerts');
  }, [navigate]);

  // ── Detect governorate from geolocation ──────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('الموقع غير مدعوم في هذا المتصفح'); return; }
    setGeoLoading(true); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`,
            { headers: { 'User-Agent': 'LiraProHub/1.0' } }
          );
          const data = await res.json() as { address?: { state?: string; county?: string } };
          const state = data.address?.state ?? data.address?.county ?? '';
          const matched = SYRIAN_GOVERNORATES.find(g => state.includes(g) || g.includes(state.slice(0, 3)));
          if (matched) { setSelectedGov(matched); }
          else { setGeoError('تعذّر تحديد المحافظة تلقائيًا — اختر يدوياً'); }
        } catch { setGeoError('فشل تحديد الموقع'); }
        setGeoLoading(false);
      },
      () => { setGeoError('تم رفض إذن الموقع'); setGeoLoading(false); }
    );
  }, []);

  // close gov picker on outside click
  useEffect(() => {
    if (!showGovPicker) return;
    const handler = () => setShowGovPicker(false);
    setTimeout(() => document.addEventListener('click', handler), 10);
    return () => document.removeEventListener('click', handler);
  }, [showGovPicker]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 pb-6">

      {/* Page Title */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-black text-primary">
            الأسواق والاقتصاد
          </h1>
          <p className="text-[11px] text-muted-foreground">
            مرجع أسعار تقديرية · ليرة سورية
            {selectedGov && <span className="text-primary font-bold"> · {selectedGov}</span>}
          </p>
        </div>
      </div>

      {/* Location Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* Locate me */}
        <button
          onClick={handleLocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all flex-shrink-0 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
        >
          {geoLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Navigation className="w-3.5 h-3.5" />}
          عرض حسب موقعي
        </button>

        {/* Governorate picker */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowGovPicker(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all flex-shrink-0 ${
              selectedGov
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {selectedGov || 'اختيار المحافظة'}
            {selectedGov
              ? <button onClick={e => { e.stopPropagation(); setSelectedGov(''); }} className="mr-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
              : <ChevronDown className="w-3 h-3 opacity-60" />}
          </button>

          <AnimatePresence>
            {showGovPicker && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                style={{ minWidth: 170 }}
              >
                <div className="p-1 flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                  {SYRIAN_GOVERNORATES.map(g => (
                    <button
                      key={g}
                      onClick={() => { setSelectedGov(g); setShowGovPicker(false); }}
                      className={`text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        selectedGov === g
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Geo error */}
        {geoError && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[10px] text-destructive font-bold flex items-center gap-1 px-2"
          >
            <AlertCircle className="w-3 h-3" /> {geoError}
          </motion.span>
        )}
      </div>

      {/* Governorate info banner when selected */}
      <AnimatePresence>
        {selectedGov && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>عرض أسعار محافظة <strong>{selectedGov}</strong> — الأسعار مرجعية وقد تتفاوت حسب المنطقة</span>
              <button onClick={() => setSelectedGov('')} className="mr-auto hover:opacity-70">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCat(cat.id); setSearch(''); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold flex-shrink-0 transition-all"
              style={isActive
                ? { background: cat.color, color: '#fff', boxShadow: `0 4px 14px ${cat.color}45` }
                : { background: cat.bg, color: cat.color, border: `1px solid ${cat.color}25` }
              }
            >
              <Icon style={{ width: 13, height: 13 }} />
              {cat.nameAr}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`ابحث في ${category.nameAr}...`}
          className="w-full pr-9 pl-9 h-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: category.bg }}>
            <category.icon style={{ width: 16, height: 16, color: category.color }} />
          </div>
          <div>
            <h2 className="font-black text-sm">{category.nameAr}</h2>
            <p className="text-[10px] text-muted-foreground">{filtered.length} سلعة · اضغط للتفاصيل والتنبيه</p>
          </div>
        </div>
      </div>

      {/* Commodity List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCat}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-2"
        >
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <Search className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">لا توجد نتائج</p>
            </div>
          ) : (
            filtered.map((c, i) => (
              <motion.button
                key={c.nameAr}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="bg-card border border-border rounded-2xl px-3 py-2.5 flex items-center gap-3 w-full text-right transition-all active:scale-[0.98] hover:border-primary/20 hover:shadow-sm"
                onClick={() => setSelected({ commodity: c, category })}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: category.bg }}>
                  <category.icon style={{ width: 17, height: 17, color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.nameAr}</p>
                  <p className="text-[10px] text-muted-foreground">{c.unit}</p>
                </div>
                <div className="text-left flex-shrink-0 flex flex-col items-end gap-0.5">
                  <p className="text-xs font-black tabular-nums" dir="ltr" style={{ color: category.color }}>
                    {fmtSYP(c.minPrice)}{c.minPrice !== c.maxPrice ? ` - ${fmtSYP(c.maxPrice)}` : ''}{' '}
                    <span className="text-[9px] text-muted-foreground font-medium">ل.س</span>
                  </p>
                  <TrendBadge trend={c.trend} />
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 opacity-50" />
              </motion.button>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 mt-1">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
          الأسعار المعروضة تقديرية واسترشادية فقط وقد تختلف بحسب المنطقة الجغرافية والموردين وظروف السوق. لا تُعدّ أسعاراً رسمية أو ملزمة.
        </p>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            commodity={selected.commodity}
            category={selected.category}
            onClose={() => setSelected(null)}
            onAddAlert={handleAddAlert}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
