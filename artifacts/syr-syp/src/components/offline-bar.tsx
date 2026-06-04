import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBar() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-bar"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#b45309,#d97706)' }}
          dir="rtl"
        >
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>بدون إنترنت — تعرض آخر بيانات محفوظة</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
