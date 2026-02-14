import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import HoloPanel from '../common/HoloPanel';

const ACCENT = '#D4A017';
const PIP_LABELS = ['SYS', 'ENG', 'WEP'] as const;
const MAX_PIPS = 8;

export default function PipDisplay() {
  const { subscribe } = useWebSocket();
  const [pips, setPips] = useState<[number, number, number]>([0, 0, 0]);
  const prevPips = useRef(pips);
  const animatedPips = useRef([0, 0, 0]);
  const rafRef = useRef<number>(0);
  const barsRef = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  useEffect(() => {
    return subscribe('status:flags', (env) => {
      const p = (env.payload as { pips?: [number, number, number] })?.pips;
      if (p) setPips(p);
    });
  }, [subscribe]);

  // Animate pips smoothly
  useEffect(() => {
    const target = pips;
    const start = prevPips.current;
    const startTime = performance.now();
    const duration = 200;

    function animate(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t * (2 - t); // ease-out quad
      for (let i = 0; i < 3; i++) {
        animatedPips.current[i] = start[i] + (target[i] - start[i]) * ease;
        const bar = barsRef.current[i];
        if (bar) {
          const pct = (animatedPips.current[i] / MAX_PIPS) * 100;
          bar.style.width = `${pct}%`;
        }
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevPips.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pips]);

  return (
    <HoloPanel title="Power Distribution" accent={ACCENT}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PIP_LABELS.map((label, i) => (
          <div key={label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 4,
              fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 2,
            }}>
              <span style={{ color: ACCENT }}>{label}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {pips[i]}/{MAX_PIPS}
              </span>
            </div>
            <div style={{
              height: 10, background: 'rgba(255,255,255,0.05)',
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid rgba(212,160,23,0.2)',
            }}>
              <div
                ref={(el) => { barsRef.current[i] = el; }}
                style={{
                  height: '100%',
                  width: `${(pips[i] / MAX_PIPS) * 100}%`,
                  background: ACCENT,
                  borderRadius: 2,
                  transition: 'none',
                  boxShadow: `0 0 6px ${ACCENT}40`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </HoloPanel>
  );
}
