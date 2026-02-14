import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGameState } from '../../hooks/useGameState';
import HoloPanel from '../common/HoloPanel';

const ACCENT = '#D4A017';

interface VitalBar {
  label: string;
  value: number;
  max: number;
  getColor: (pct: number) => string;
  format: (value: number, max: number) => string;
}

function hullColor(pct: number): string {
  if (pct > 0.6) return '#4e9a3e';
  if (pct > 0.3) return '#d4a017';
  return '#ff4444';
}

function fuelColor(_pct: number): string {
  return '#4ecfd0';
}

function heatColor(pct: number): string {
  if (pct < 0.4) return '#4ecfd0';
  if (pct < 0.7) return '#d09a4e';
  return '#ff4444';
}

export default function ShipVitals() {
  const { subscribe } = useWebSocket();
  const gameState = useGameState();

  const [hull, setHull] = useState(1.0);
  const [fuelMain, setFuelMain] = useState(0);
  const [fuelCapacity, setFuelCapacity] = useState(1);
  const [heat, setHeat] = useState(0);

  // Animated values driven by rAF
  const animRef = useRef({ hull: 1.0, fuel: 0, heat: 0 });
  const targetRef = useRef({ hull: 1.0, fuel: 0, heat: 0 });
  const barsRef = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([null, null, null]);
  const rafRef = useRef<number>(0);

  // Initialize from game state
  useEffect(() => {
    const ship = gameState.ship;
    if (ship) {
      setHull(ship.hullHealth ?? 1.0);
      setFuelMain(ship.fuelLevel ?? 0);
      setFuelCapacity(ship.fuelCapacity ?? 1);
    }
  }, [gameState.ship]);

  // Listen for real-time status updates
  useEffect(() => {
    return subscribe('status:flags', (env) => {
      const p = env.payload as {
        fuelMain?: number;
        fuelReservoir?: number;
      };
      if (p.fuelMain !== undefined) setFuelMain(p.fuelMain);
    });
  }, [subscribe]);

  // Listen for ship state updates (hull changes)
  useEffect(() => {
    return subscribe('state:ship', (env) => {
      const ship = env.payload as {
        hullHealth?: number;
        fuel?: { main?: number; mainCapacity?: number };
        cargoCapacity?: number;
      };
      if (ship.hullHealth !== undefined) setHull(ship.hullHealth);
      if (ship.fuel?.main !== undefined) setFuelMain(ship.fuel.main);
      if (ship.fuel?.mainCapacity !== undefined) setFuelCapacity(ship.fuel.mainCapacity);
    });
  }, [subscribe]);

  // Update targets whenever state values change
  useEffect(() => {
    targetRef.current = {
      hull,
      fuel: fuelCapacity > 0 ? fuelMain / fuelCapacity : 0,
      heat,
    };
  }, [hull, fuelMain, fuelCapacity, heat]);

  // rAF animation loop
  const animate = useCallback(() => {
    const anim = animRef.current;
    const target = targetRef.current;
    const lerp = 0.12;

    anim.hull += (target.hull - anim.hull) * lerp;
    anim.fuel += (target.fuel - anim.fuel) * lerp;
    anim.heat += (target.heat - anim.heat) * lerp;

    const values = [anim.hull, anim.fuel, anim.heat];
    const colors = [hullColor, fuelColor, heatColor];
    const formats = [
      (v: number) => `${(v * 100).toFixed(0)}%`,
      (v: number) => `${(v * 100).toFixed(0)}%`,
      (v: number) => `${(v * 100).toFixed(0)}%`,
    ];

    for (let i = 0; i < 3; i++) {
      const bar = barsRef.current[i];
      const label = labelsRef.current[i];
      const pct = Math.max(0, Math.min(1, values[i]));
      if (bar) {
        bar.style.width = `${pct * 100}%`;
        bar.style.background = colors[i](pct);
        bar.style.boxShadow = `0 0 8px ${colors[i](pct)}40`;
      }
      if (label) {
        label.textContent = formats[i](pct);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const vitals = [
    { label: 'HULL', initial: hull },
    { label: 'FUEL', initial: fuelCapacity > 0 ? fuelMain / fuelCapacity : 0 },
    { label: 'HEAT', initial: heat },
  ];

  return (
    <HoloPanel title="Ship Vitals" accent={ACCENT}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vitals.map((v, i) => (
          <div key={v.label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 4,
              fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 2,
            }}>
              <span style={{ color: ACCENT }}>{v.label}</span>
              <span
                ref={(el) => { labelsRef.current[i] = el; }}
                style={{ color: 'var(--color-text-muted)' }}
              >
                {(v.initial * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{
              height: 10, background: 'rgba(255,255,255,0.05)',
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid rgba(212,160,23,0.15)',
            }}>
              <div
                ref={(el) => { barsRef.current[i] = el; }}
                style={{
                  height: '100%',
                  width: `${v.initial * 100}%`,
                  borderRadius: 2,
                  transition: 'none',
                }}
              />
            </div>
          </div>
        ))}
        <div style={{
          fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4,
        }}>
          {fuelMain.toFixed(1)} / {fuelCapacity.toFixed(1)}t fuel
        </div>
      </div>
    </HoloPanel>
  );
}
