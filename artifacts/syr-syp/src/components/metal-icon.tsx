import React from 'react';

interface MetalIconProps {
  symbol: string;
  size?: number;
}

function GoldIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gold bar base */}
      <rect x="4" y="18" width="32" height="14" rx="2" fill="#B8860B" />
      <rect x="4" y="18" width="32" height="14" rx="2" fill="url(#goldGrad1)" />
      {/* Top face */}
      <path d="M8 14 L32 14 L36 18 L4 18 Z" fill="#FFD700" />
      <path d="M8 14 L32 14 L36 18 L4 18 Z" fill="url(#goldGrad2)" />
      {/* Left face */}
      <path d="M4 18 L8 14 L8 28 L4 32 Z" fill="#9A7100" />
      {/* Shine lines */}
      <line x1="10" y1="20" x2="10" y2="30" stroke="#FFE566" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1="20" y1="20" x2="20" y2="30" stroke="#FFE566" strokeWidth="1" strokeOpacity="0.4" />
      {/* Stamping */}
      <rect x="13" y="22" width="14" height="6" rx="1" fill="#9A7100" fillOpacity="0.3" />
      <text x="20" y="27" fontSize="5" fill="#FFE566" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Au</text>
      <defs>
        <linearGradient id="goldGrad1" x1="4" y1="18" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="goldGrad2" x1="8" y1="14" x2="36" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFEC6E" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SilverIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coin outer ring */}
      <circle cx="20" cy="20" r="16" fill="url(#silverGrad1)" />
      <circle cx="20" cy="20" r="13" fill="url(#silverGrad2)" />
      {/* Inner design */}
      <circle cx="20" cy="20" r="10" fill="#C0C0C0" fillOpacity="0.4" />
      {/* Cross lines */}
      <line x1="14" y1="14" x2="26" y2="26" stroke="#A8A8A8" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="26" y1="14" x2="14" y2="26" stroke="#A8A8A8" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="20" cy="20" r="7" fill="#D8D8D8" fillOpacity="0.3" />
      <text x="20" y="23" fontSize="7" fill="#888" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Ag</text>
      {/* Shine */}
      <ellipse cx="14" cy="15" rx="3" ry="2" fill="white" fillOpacity="0.4" transform="rotate(-30 14 15)" />
      <defs>
        <linearGradient id="silverGrad1" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8E8E8" />
          <stop offset="40%" stopColor="#B0B0B0" />
          <stop offset="100%" stopColor="#808080" />
        </linearGradient>
        <linearGradient id="silverGrad2" x1="7" y1="7" x2="33" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F5F5" />
          <stop offset="50%" stopColor="#C8C8C8" />
          <stop offset="100%" stopColor="#969696" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PlatinumIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crystal / hexagon */}
      <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="url(#platGrad)" />
      <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" stroke="#7EC8E3" strokeWidth="1" strokeOpacity="0.6" fill="none" />
      {/* Inner facets */}
      <polygon points="20,10 28,15 28,25 20,30 12,25 12,15" fill="#E0F4FF" fillOpacity="0.3" />
      <line x1="20" y1="4" x2="20" y2="30" stroke="#B0D9FF" strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="6" y1="12" x2="34" y2="28" stroke="#B0D9FF" strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="34" y1="12" x2="6" y2="28" stroke="#B0D9FF" strokeWidth="0.7" strokeOpacity="0.5" />
      <text x="20" y="23" fontSize="6" fill="#E0F4FF" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Pt</text>
      {/* Sparkle */}
      <path d="M29 8 L30 11 L33 12 L30 13 L29 16 L28 13 L25 12 L28 11 Z" fill="white" fillOpacity="0.8" />
      <defs>
        <linearGradient id="platGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A8D8EA" />
          <stop offset="50%" stopColor="#5B9EC9" />
          <stop offset="100%" stopColor="#2E6A9A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PalladiumIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Atom nucleus */}
      <circle cx="20" cy="20" r="4" fill="url(#palGrad)" />
      {/* Orbit 1 */}
      <ellipse cx="20" cy="20" rx="15" ry="6" stroke="#A855F7" strokeWidth="1.5" fill="none" strokeOpacity="0.8" />
      {/* Orbit 2 - rotated 60deg */}
      <ellipse cx="20" cy="20" rx="15" ry="6" stroke="#C084FC" strokeWidth="1.5" fill="none" strokeOpacity="0.6"
        transform="rotate(60 20 20)" />
      {/* Orbit 3 - rotated 120deg */}
      <ellipse cx="20" cy="20" rx="15" ry="6" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeOpacity="0.5"
        transform="rotate(120 20 20)" />
      {/* Electrons */}
      <circle cx="35" cy="20" r="2.5" fill="#DDD6FE" />
      <circle cx="12" cy="28" r="2.5" fill="#C4B5FD" transform="rotate(60 20 20)" />
      <circle cx="12" cy="12" r="2.5" fill="#A78BFA" transform="rotate(120 20 20)" />
      <text x="20" y="22.5" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Pd</text>
      <defs>
        <radialGradient id="palGrad" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function CopperIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wire coil representation */}
      {/* Base cylinder */}
      <ellipse cx="20" cy="31" rx="13" ry="4" fill="#7A3800" />
      <rect x="7" y="14" width="26" height="17" fill="url(#copperGrad)" />
      <ellipse cx="20" cy="14" rx="13" ry="4" fill="#F87A30" />
      {/* Wire rings */}
      <ellipse cx="20" cy="18" rx="13" ry="4" stroke="#FFA060" strokeWidth="2" fill="none" />
      <ellipse cx="20" cy="22" rx="13" ry="4" stroke="#F87A30" strokeWidth="2" fill="none" />
      <ellipse cx="20" cy="26" rx="13" ry="4" stroke="#D96020" strokeWidth="2" fill="none" />
      {/* Left side */}
      <line x1="7" y1="14" x2="7" y2="31" stroke="#8B4500" strokeWidth="1" />
      <line x1="33" y1="14" x2="33" y2="31" stroke="#C06030" strokeWidth="1" />
      {/* Symbol */}
      <text x="20" y="16.5" fontSize="5.5" fill="#7A3800" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Cu</text>
      <defs>
        <linearGradient id="copperGrad" x1="7" y1="14" x2="33" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F08030" />
          <stop offset="100%" stopColor="#8B4500" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const METAL_ICONS: Record<string, React.FC<{ size?: number }>> = {
  XAU: GoldIcon,
  XAG: SilverIcon,
  XPT: PlatinumIcon,
  XPD: PalladiumIcon,
  XCU: CopperIcon,
  HG: CopperIcon,
};

export function MetalIcon({ symbol, size = 40 }: MetalIconProps) {
  const Icon = METAL_ICONS[symbol];
  if (!Icon) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" fill="#64748b" />
        <text x="20" y="24" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">{symbol.slice(0,2)}</text>
      </svg>
    );
  }
  return <Icon size={size} />;
}
