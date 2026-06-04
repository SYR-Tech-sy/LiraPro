import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LOGO_FONT = "'Orbitron', sans-serif";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

interface AnimatedLogoProps {
  fontSize?: string;
  color?: string;
}

function LetterShimmer({ delay }: { delay: number }) {
  return (
    <motion.span
      aria-hidden
      className="absolute inset-0 pointer-events-none rounded-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ delay: delay + 0.08, duration: 0.5, ease: 'easeOut', times: [0, 0.35, 1] }}
      style={{
        background:
          'linear-gradient(110deg, transparent 15%, rgba(255,255,255,0.65) 50%, transparent 85%)',
      }}
    />
  );
}

function ProGlow({ fontSize, color }: { fontSize: string; color: string }) {
  return (
    <motion.span
      className="relative inline-block select-none"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.65, type: 'spring', damping: 13, stiffness: 210 }}
      style={{ fontFamily: LOGO_FONT, fontSize, fontWeight: 900, lineHeight: 1, position: 'relative' }}
    >
      {/* Actual text */}
      <motion.span
        style={{ position: 'relative', zIndex: 1, color }}
      >
        Pro
      </motion.span>

      {/* Shine sweep */}
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-sm overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 0.73, duration: 0.5, ease: 'easeOut', times: [0, 0.35, 1] }}
        style={{
          background:
            'linear-gradient(110deg, transparent 15%, rgba(255,255,255,0.3) 50%, transparent 85%)',
        }}
      />
    </motion.span>
  );
}

export function AnimatedLogo({
  fontSize = 'clamp(2.1rem, 8vw, 2.8rem)',
  color,
}: AnimatedLogoProps) {
  const isDark = useDarkMode();
  const effectiveColor = color ?? (isDark ? '#ffffff' : '#003C32');

  const letterDelay = [0, 0.2, 0.4];
  const staticParts: string[] = ['L', 'ira'];

  return (
    <div className="flex items-center" dir="ltr" style={{ gap: '0.05em' }}>
      {staticParts.map((part, i) => (
        <motion.span
          key={part}
          className="relative inline-block select-none"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: letterDelay[i], type: 'spring', damping: 13, stiffness: 210 }}
          style={{ fontFamily: LOGO_FONT, fontSize, fontWeight: 900, color: effectiveColor, lineHeight: 1 }}
        >
          {part}
          <LetterShimmer delay={letterDelay[i]!} />
        </motion.span>
      ))}
      <ProGlow fontSize={fontSize} color={effectiveColor} />
    </div>
  );
}
