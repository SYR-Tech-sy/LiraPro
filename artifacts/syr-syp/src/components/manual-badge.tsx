import React, { useState, useRef, useEffect } from 'react';

interface ManualBadgeProps {
  className?: string;
  updatedAt?: string;
}

function relativeTimeAr(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'منذ أقل من دقيقة';
  if (minutes < 60) {
    if (minutes === 1) return 'منذ دقيقة واحدة';
    if (minutes === 2) return 'منذ دقيقتين';
    if (minutes <= 10) return `منذ ${minutes} دقائق`;
    return `منذ ${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (hours === 1) return 'منذ ساعة واحدة';
    if (hours === 2) return 'منذ ساعتين';
    if (hours <= 10) return `منذ ${hours} ساعات`;
    return `منذ ${hours} ساعة`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return 'منذ يوم واحد';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return `منذ ${days} يوماً`;
}

export function ManualBadge({ className = '', updatedAt }: ManualBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label="سعر مُعيَّن يدوياً"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/50 cursor-help select-none"
        style={{ lineHeight: 1.2 }}
      >
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 flex-shrink-0" fill="none" aria-hidden="true">
          <path d="M2 9.5L6 2.5L10 9.5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.3" />
          <line x1="6" y1="6" x2="6" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="6" cy="8.5" r="0.6" fill="currentColor" />
        </svg>
        يدوي
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full mb-1.5 right-0 w-48 bg-popover border border-border rounded-xl shadow-xl p-2.5 text-[10px] text-foreground/80 dark:text-white/80 leading-relaxed pointer-events-none"
          style={{ whiteSpace: 'normal' }}
        >
          هذا السعر مُعيَّن يدوياً من قِبَل الإدارة وليس سعراً مباشراً من السوق.
          {updatedAt && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
              {relativeTimeAr(updatedAt)}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
