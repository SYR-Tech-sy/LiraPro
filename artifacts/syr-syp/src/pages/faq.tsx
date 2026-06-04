import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, HelpCircle, MessageSquare } from 'lucide-react';

function FloatingRobot() {
  const [eyeOpen, setEyeOpen] = useState(true);
  const [gazeX, setGazeX] = useState(0);
  const [gazeY, setGazeY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gazeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const d = Math.hypot(dx, dy) || 1;
    const factor = Math.min(d / 200, 1) * 1.6;
    setGazeX((dx / d) * factor);
    setGazeY((dy / d) * factor);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 5000;
      blinkTimerRef.current = setTimeout(() => {
        setEyeOpen(false);
        setTimeout(() => { setEyeOpen(true); scheduleBlink(); }, 120 + Math.random() * 80);
      }, delay);
    };
    scheduleBlink();
    return () => { if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current); };
  }, []);

  useEffect(() => {
    const scheduleGaze = () => {
      const delay = 4000 + Math.random() * 4000;
      gazeTimerRef.current = setTimeout(() => {
        const dir = Math.random();
        if (dir < 0.33) { setGazeX(-1.5); setGazeY(0); }
        else if (dir < 0.66) { setGazeX(1.5); setGazeY(0); }
        else { setGazeX(0); setGazeY(1.0); }
        setTimeout(() => { setGazeX(0); setGazeY(0); scheduleGaze(); }, 800 + Math.random() * 600);
      }, delay);
    };
    scheduleGaze();
    return () => { if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current); };
  }, []);

  const eyeOffX = gazeX * 2;
  const eyeOffY = gazeY * 2;

  return (
    <motion.div
      ref={containerRef}
      className="relative"
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse, rgba(0,180,100,0.25) 0%, transparent 70%)', filter: 'blur(8px)' }}
      />
      <div className="w-28 h-28 relative z-10">
        <svg width="112" height="112" viewBox="0 0 96 104" style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 20px rgba(0,180,90,0.55))' }} aria-hidden="true">
          <defs>
            <linearGradient id="faqBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(162,100%,10%)">
                <animate attributeName="stop-color" values="hsl(162,100%,10%);hsl(162,85%,28%);hsl(162,75%,44%);hsl(162,85%,28%);hsl(162,100%,10%)" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="55%" stopColor="rgba(0,200,120,0.96)" />
              <stop offset="100%" stopColor="hsl(162,75%,46%)">
                <animate attributeName="stop-color" values="hsl(162,75%,46%);hsl(162,90%,58%);hsl(162,100%,12%);hsl(162,90%,58%);hsl(162,75%,46%)" dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <radialGradient id="faqBallGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="50%" stopColor="rgba(180,255,210,0.9)" />
              <stop offset="100%" stopColor="rgba(0,180,90,0.85)" />
            </radialGradient>
            <filter id="faqEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Body */}
          <path d="M18,16 Q18,6 28,6 L68,6 Q78,6 78,16 L78,62 Q78,72 68,72 L42,72 L34,86 L37,72 L28,72 Q18,72 18,62 Z"
            fill="url(#faqBodyGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" />
          <path d="M22,16 Q22,10 28,10 L68,10 Q74,10 74,16 L74,26 Q50,30 22,26 Z" fill="rgba(255,255,255,0.20)" />
          {/* Screen */}
          <rect x="26" y="26" width="44" height="30" rx="8" fill="rgba(2,14,8,0.94)" />
          <rect x="26" y="26" width="44" height="30" rx="8" fill="none" stroke="rgba(0,220,110,0.50)" strokeWidth="0.9" />
          {/* Left eye — JS-driven gaze + blink */}
          <rect
            x={34 + eyeOffX}
            y={eyeOpen ? 32 + eyeOffY : 39 + eyeOffY}
            width="11"
            height={eyeOpen ? 18 : 3}
            rx="3"
            fill="white"
            opacity="0.96"
            filter="url(#faqEyeGlow)"
            style={{ transition: 'y 0.12s ease, height 0.12s ease' }}
          />
          {/* Right eye */}
          <rect
            x={51 + eyeOffX}
            y={eyeOpen ? 32 + eyeOffY : 39 + eyeOffY}
            width="11"
            height={eyeOpen ? 18 : 3}
            rx="3"
            fill="white"
            opacity="0.96"
            filter="url(#faqEyeGlow)"
            style={{ transition: 'y 0.12s ease, height 0.12s ease' }}
          />
          {/* Antenna */}
          <line x1="48" y1="6" x2="48" y2="-2" stroke="rgba(100,255,170,0.82)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="48" cy="-6" r="5" fill="url(#faqBallGrad)">
            <animate attributeName="r" values="4.5;6;4.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Side arm */}
          <path d="M78,38 Q90,34 88,28" fill="none" stroke="rgba(100,255,170,0.70)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="88" cy="26" r="4.5" fill="url(#faqBallGrad)" opacity="0.85" />
        </svg>
      </div>
    </motion.div>
  );
}

const faqs = [
  {
    q: 'كيف يتم تحديث أسعار الصرف؟',
    a: 'يتم تحديث الأسعار كل بضع دقائق من مصادر موثوقة ومتعددة، مع إمكانية تعيين أسعار مخصصة من قِبل فريق الإدارة.',
  },
  {
    q: 'هل يمكنني إعداد تنبيهات للأسعار؟',
    a: 'نعم، يمكنك إعداد تنبيهات سعرية لأي عملة. ستتلقى إشعاراً فورياً عند وصول السعر إلى الحد الذي حددته.',
  },
  {
    q: 'كيف أسجّل طلباً كتاجر؟',
    a: 'اذهب إلى صفحة الملف الشخصي، اختر "أريد أن أكون تاجراً"، ثم أكمل نموذج التقديم. سيراجع الفريق طلبك خلال ٢٤ ساعة.',
  },
  {
    q: 'ما هي محفظة الممتلكات؟',
    a: 'محفظة الممتلكات تتيح لك تتبع قيمة ما تمتلكه من عملات وذهب بالليرة السورية، مع تحديث تلقائي عند تغير الأسعار.',
  },
  {
    q: 'هل التطبيق مجاني؟',
    a: 'نعم، التطبيق مجاني بالكامل. جميع الميزات الأساسية متاحة بدون رسوم.',
  },
  {
    q: 'كيف أتواصل مع الدعم الفني؟',
    a: 'يمكنك التواصل مع فريق الدعم عبر زر المساعد الذكي في الأسفل، أو الذهاب لصفحة الدعم من القائمة.',
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col pb-24 min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60 px-4 py-3 flex items-center gap-3">
        <Link href="/app/home">
          <button className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h1 className="text-base font-black">مركز المساعدة</h1>
        </div>
      </div>

      <div className="px-4 pt-8 flex flex-col items-center gap-8">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl bg-gradient-to-br from-primary to-primary/75 p-6 text-white text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <HelpCircle className="w-8 h-8" />
            </div>
          </div>
          <h2 className="font-black text-xl mb-2">الأسئلة الشائعة</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            للحصول على إجابة فورية لأي سؤال، تواصل مع المساعد الذكي
          </p>
        </motion.div>

        {/* AI Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-5 py-4"
        >
          <FloatingRobot />

          <div className="text-center flex flex-col gap-2">
            <h3 className="text-lg font-black text-foreground">تواصل مع المساعد الذكي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              المساعد الذكي يجيب على أي سؤال عن المنصة، الأسعار، العملات، أو أي استفسار آخر
            </p>
          </div>

          <Link href="/app/support">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border text-foreground font-bold text-sm shadow-sm active:scale-95 transition-transform">
              <MessageSquare className="w-4 h-4" />
              ابدأ محادثة الآن
            </button>
          </Link>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full flex flex-col gap-3 pb-4"
        >
          <h3 className="text-base font-black text-foreground px-1">الأسئلة الشائعة</h3>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-right gap-3"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="text-sm font-bold text-foreground">{faq.q}</span>
                <motion.span
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-muted-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </button>
              {openIdx === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
