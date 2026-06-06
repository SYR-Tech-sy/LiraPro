import React, { useState, useRef, useEffect } from 'react';

interface ManualBadgeProps {
  className?: string;
}

export function ManualBadge({ className = '' }: ManualBadgeProps) {
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
          className="absolute z-50 bottom-full mb-1.5 right-0 w-44 bg-popover border border-border rounded-xl shadow-xl p-2.5 text-[10px] text-foreground/80 dark:text-white/80 leading-relaxed pointer-events-none"
          style={{ whiteSpace: 'normal' }}
        >
          هذا السعر مُعيَّن يدوياً من قِبَل الإدارة وليس سعراً مباشراً من السوق.
        </span>
      )}
    </span>
  );
}
