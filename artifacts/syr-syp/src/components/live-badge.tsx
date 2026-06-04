import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';

export type LiveBadgeVariant = 'forex' | 'crypto';

/**
 * Forex market hours (UTC):
 *  Opens Sunday 22:00 — Closes Friday 22:00
 */
export function isForexOpen(): boolean {
  const now  = new Date();
  const day  = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 0 && hour < 22) return false;
  if (day === 5 && hour >= 22) return false;
  return true;
}

export function useMarketOpen(): boolean {
  const [open, setOpen] = useState(isForexOpen);
  useEffect(() => {
    const iv = setInterval(() => setOpen(isForexOpen()), 60_000);
    return () => clearInterval(iv);
  }, []);
  return open;
}

/**
 * variant='forex' (default): "مباشر" when open, "السوق مغلق" when closed
 * variant='crypto': always shows "مباشر" (24/7)
 */
export function LiveBadge({ variant = 'forex' }: { variant?: LiveBadgeVariant }) {
  const { t } = useApp();
  const open = useMarketOpen();

  if (variant === 'crypto' || open) {
    return (
      <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:!text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 dark:border-green-700 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        {t('live')}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:!text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-700 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
      {t('marketClosed')}
    </span>
  );
}
