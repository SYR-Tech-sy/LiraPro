import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';

const BTN = 72;
const PEEK = 14;
const EDGE_SNAP = 70;

export function FloatingAiButton() {
  const [, navigate] = useLocation();
  const [onSupport] = useRoute('/app/support');
  const [onLanding] = useRoute('/');

  // Always start visible — only collapse to edge when user explicitly presses the arrow
  const [isEdged, setIsEdged] = useState(false);
  const [edgeSide, setEdgeSide] = useState<'right' | 'left'>('right');

  const persistEdge = (edged: boolean, side?: 'right' | 'left') => {
    try {
      localStorage.setItem('syp-ai-edged', String(edged));
      if (side) localStorage.setItem('syp-ai-edge-side', side);
    } catch {}
  };

  const [eyeOpen, setEyeOpen] = useState(true);
  const [gazeX, setGazeX] = useState(0);
  const [gazeY, setGazeY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gazeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const didMoveRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });

  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 300, y: 400 };
    // Always start fully visible — saved edge position is ignored on load
    return { x: window.innerWidth - BTN - 16, y: window.innerHeight - BTN - 130 };
  });
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-arrow]')) return;
    e.stopPropagation();
    isDraggingRef.current = false;
    didMoveRef.current = false;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, ex: posRef.current.x, ey: posRef.current.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragStartRef.current.mx;
    const dy = e.clientY - dragStartRef.current.my;
    if (!isDraggingRef.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      isDraggingRef.current = true;
      didMoveRef.current = true;
    }
    if (!isDraggingRef.current) return;
    const newX = Math.max(0, Math.min(window.innerWidth - BTN, dragStartRef.current.ex + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - BTN - 55, dragStartRef.current.ey + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const p = posRef.current;
    const rightDist = window.innerWidth - p.x - BTN;
    const leftDist = p.x;
    if (rightDist < EDGE_SNAP) {
      setEdgeSide('right');
      setPos(pv => ({ ...pv, x: window.innerWidth - PEEK }));
      setIsEdged(true);
      persistEdge(true, 'right');
    } else if (leftDist < EDGE_SNAP) {
      setEdgeSide('left');
      setPos(pv => ({ ...pv, x: -(BTN - PEEK) }));
      setIsEdged(true);
      persistEdge(true, 'left');
    } else {
      setIsEdged(false);
      persistEdge(false);
    }
  }, []);

  // Arrow click: snap to nearest edge (peek strip mode)
  const handleArrowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (didMoveRef.current) { didMoveRef.current = false; return; }
    const p = posRef.current;
    const rightDist = window.innerWidth - p.x - BTN;
    const leftDist = p.x;
    const side = rightDist <= leftDist ? 'right' : 'left';
    setEdgeSide(side);
    setPos(pv => ({
      ...pv,
      x: side === 'right' ? window.innerWidth - PEEK : -(BTN - PEEK),
    }));
    setIsEdged(true);
    persistEdge(true, side);
  }, []);

  // Peek strip click: restore button
  const handlePeekClick = useCallback(() => {
    setIsEdged(false);
    persistEdge(false);
    if (edgeSide === 'right') {
      setPos(pv => ({ ...pv, x: window.innerWidth - BTN - 16 }));
    } else {
      setPos(pv => ({ ...pv, x: 16 }));
    }
  }, [edgeSide]);

  const handleBtnClick = useCallback(() => {
    if (didMoveRef.current) { didMoveRef.current = false; return; }
    navigate('/app/support');
  }, [navigate]);

  if (onSupport || onLanding) return null;

  const isRight = pos.x + BTN / 2 > window.innerWidth / 2;

  const eyeOffX = gazeX * 1.2;
  const eyeOffY = gazeY * 0.8;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 400,
        width: BTN,
        height: BTN,
        touchAction: 'none',
        userSelect: 'none',
        transition: isEdged ? 'left 0.38s cubic-bezier(0.4, 0, 0.2, 1), top 0.38s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ai-bloom {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.18); }
        }
        @keyframes ai-antenna-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(0,200,100,0.8)); }
          50% { filter: drop-shadow(0 0 7px rgba(100,255,170,1)); }
        }
        @keyframes body-grad-shift {
          0%   { stop-color: hsl(162,100%,10%); }
          25%  { stop-color: hsl(162,85%,28%); }
          50%  { stop-color: hsl(162,75%,44%); }
          75%  { stop-color: hsl(162,85%,28%); }
          100% { stop-color: hsl(162,100%,10%); }
        }
        @keyframes body-grad-shift2 {
          0%   { stop-color: hsl(162,75%,46%); }
          25%  { stop-color: hsl(162,90%,58%); }
          50%  { stop-color: hsl(162,100%,12%); }
          75%  { stop-color: hsl(162,90%,58%); }
          100% { stop-color: hsl(162,75%,46%); }
        }
        @keyframes edge-theme-strip {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }
        .ai-float-anim { animation: ai-float 4.5s ease-in-out infinite; }
        .ai-bloom-anim { animation: ai-bloom 3s ease-in-out infinite; }
        .ai-antenna-anim { animation: ai-antenna-glow 2s ease-in-out infinite; }
        .ai-body-stop1 { animation: body-grad-shift 4s ease-in-out infinite; }
        .ai-body-stop2 { animation: body-grad-shift2 4s ease-in-out infinite; }
        .edge-theme-strip {
          background: linear-gradient(to bottom,
            hsl(162, 100%, 12%),
            hsl(162, 75%, 40%),
            hsl(162, 90%, 55%),
            hsl(162, 75%, 40%),
            hsl(162, 100%, 12%));
          background-size: 100% 300%;
          animation: edge-theme-strip 3s ease-in-out infinite;
        }
      `}</style>

      {isEdged ? (
        <div
          onClick={handlePeekClick}
          className="edge-theme-strip"
          style={{
            position: 'absolute',
            left: edgeSide === 'right' ? 0 : undefined,
            right: edgeSide === 'left' ? 0 : undefined,
            top: 0,
            width: PEEK,
            height: BTN,
            borderRadius: edgeSide === 'right' ? '6px 0 0 6px' : '0 6px 6px 0',
            cursor: 'pointer',
            boxShadow: edgeSide === 'right'
              ? '-2px 0 14px rgba(0,180,100,0.45)'
              : '2px 0 14px rgba(0,180,100,0.45)',
          }}
        />
      ) : (
        <div className="ai-float-anim" style={{ position: 'relative', width: BTN, height: BTN }}>

          {/* Outer halo bloom */}
          <div className="ai-bloom-anim" style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,180,100,0.16) 0%, rgba(0,160,80,0.08) 55%, transparent 72%)',
            pointerEvents: 'none',
          }} />

          {/* Ground shadow */}
          <div className="ai-bloom-anim" style={{
            position: 'absolute', bottom: -6, left: '18%', right: '18%', height: 8,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,160,80,0.38) 0%, rgba(0,120,60,0.15) 60%, transparent 80%)',
            filter: 'blur(4px)', pointerEvents: 'none',
          }} />

          {/* Robot SVG */}
          <div
            onClick={handleBtnClick}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="64" height="70"
              viewBox="0 0 96 104"
              style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 16px rgba(0,180,90,0.60))' }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="bodyGradAiAnim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%">
                    <animate
                      attributeName="stop-color"
                      values="hsl(162,100%,10%);hsl(162,85%,28%);hsl(162,75%,44%);hsl(162,85%,28%);hsl(162,100%,10%)"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="55%" stopColor="rgba(0,200,120,0.96)" />
                  <stop offset="100%">
                    <animate
                      attributeName="stop-color"
                      values="hsl(162,75%,46%);hsl(162,90%,58%);hsl(162,100%,12%);hsl(162,90%,58%);hsl(162,75%,46%)"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
                <radialGradient id="ballGradAi" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(180,255,210,0.9)" />
                  <stop offset="100%" stopColor="rgba(0,180,90,0.85)" />
                </radialGradient>
                <filter id="eyeGlowAi" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="bodyGlowAi" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <path
                d="M18,16 Q18,6 28,6 L68,6 Q78,6 78,16 L78,62 Q78,72 68,72 L42,72 L34,86 L37,72 L28,72 Q18,72 18,62 Z"
                fill="url(#bodyGradAiAnim)"
                filter="url(#bodyGlowAi)"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="0.9"
              />
              <path
                d="M22,16 Q22,10 28,10 L68,10 Q74,10 74,16 L74,26 Q50,30 22,26 Z"
                fill="rgba(255,255,255,0.22)"
              />
              <rect x="26" y="26" width="44" height="30" rx="8"
                fill="rgba(2,14,8,0.94)"
              />
              <rect x="26" y="26" width="44" height="30" rx="8"
                fill="none"
                stroke="rgba(0,220,110,0.52)"
                strokeWidth="0.9"
              />
              <rect x="27" y="27" width="42" height="28" rx="7"
                fill="none"
                stroke="rgba(0,220,110,0.22)"
                strokeWidth="0.5"
              />
              <rect
                x={34 + eyeOffX} y={eyeOpen ? 32 + eyeOffY : 39 + eyeOffY}
                width="11"
                height={eyeOpen ? 18 : 3}
                rx="3"
                fill="white"
                opacity="0.96"
                filter="url(#eyeGlowAi)"
                style={{ transition: 'y 0.12s ease, height 0.12s ease' }}
              />
              <rect
                x={51 + eyeOffX} y={eyeOpen ? 32 + eyeOffY : 39 + eyeOffY}
                width="11"
                height={eyeOpen ? 18 : 3}
                rx="3"
                fill="white"
                opacity="0.96"
                filter="url(#eyeGlowAi)"
                style={{ transition: 'y 0.12s ease, height 0.12s ease' }}
              />
              <line x1="48" y1="6" x2="48" y2="-2"
                stroke="rgba(100,255,170,0.82)" strokeWidth="1.8" strokeLinecap="round"
              />
              <circle cx="48" cy="-6" r="5"
                fill="url(#ballGradAi)"
                className="ai-antenna-anim"
              />
              <path d="M78,38 Q90,34 88,28"
                fill="none"
                stroke="rgba(100,255,170,0.70)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="88" cy="26" r="4.5"
                fill="url(#ballGradAi)"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Arrow snap button */}
          <button
            data-arrow="true"
            onClick={handleArrowClick}
            title="إخفاء المساعد للحافة"
            style={{
              position: 'absolute',
              top: -8,
              [isRight ? 'left' : 'right']: -7,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(2,20,10,0.88)',
              border: '1.5px solid rgba(0,200,100,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)',
              padding: 0, touchAction: 'none',
              boxShadow: '0 0 8px rgba(0,200,80,0.38)',
            }}
          >
            {isRight
              ? <ChevronRight style={{ width: 13, height: 13, color: 'rgba(100,255,170,0.95)' }} />
              : <ChevronLeft style={{ width: 13, height: 13, color: 'rgba(100,255,170,0.95)' }} />}
          </button>

          {/* Label */}
          <div style={{
            position: 'absolute', bottom: -20, left: '50%',
            transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: 8, fontWeight: 700, color: 'var(--muted-foreground)',
              background: 'var(--card)', padding: '1px 6px', borderRadius: 99,
              border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              المساعد
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
