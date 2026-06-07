import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface GuestModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function GuestModal({ open, onClose, feature = 'هذه الميزة' }: GuestModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-white font-bold text-lg text-center">تسجيل الدخول مطلوب</h2>
              <p className="text-white/70 text-xs text-center mt-1">
                سجّل دخولك للوصول إلى {feature}
              </p>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <Link href="/sign-in" onClick={onClose} className="w-full">
                <Button className="w-full gap-2 h-11" size="lg">
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/sign-up" onClick={onClose} className="w-full">
                <Button variant="outline" className="w-full gap-2 h-11" size="lg">
                  <UserPlus className="w-4 h-4" />
                  إنشاء حساب جديد
                </Button>
              </Link>
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 text-center"
              >
                متابعة كضيف
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
