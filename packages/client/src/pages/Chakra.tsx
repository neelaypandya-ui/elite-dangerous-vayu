import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import EventFeed from '../components/chakra/EventFeed';
import ShipVitals from '../components/chakra/ShipVitals';
import ActivityContext from '../components/chakra/ActivityContext';
import PipDisplay from '../components/chakra/PipDisplay';

const ACCENT = '#D4A017';

interface ChakraState {
  recentEvents: Record<string, unknown>[];
  activity: { activity: string; detail: string | null; since: string };
  eventCount: number;
}

export default function Chakra() {
  const { data, loading, fetch: load } = useApi<ChakraState>('/chakra/state');
  const { connected } = useWebSocket();

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', color: ACCENT,
            letterSpacing: 3, marginBottom: 4, fontSize: 28,
          }}>
            CHAKRA
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
            Continuous Health & Activity Keeper for Real-time Awareness
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#4e9a3e' : '#ff4444',
            display: 'inline-block',
            boxShadow: connected ? '0 0 6px #4e9a3e' : '0 0 6px #ff4444',
          }} />
          <span style={{ color: connected ? '#4e9a3e' : '#ff4444' }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Top Row: Activity, Ship Vitals, Pips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, marginBottom: 16 }}>
        <ActivityContext initial={data?.activity} />
        <ShipVitals />
        <div style={{ minWidth: 200 }}>
          <PipDisplay />
        </div>
      </div>

      {/* Live Event Feed */}
      {loading && !data ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14, padding: 24, textAlign: 'center' }}>
          Loading CHAKRA...
        </div>
      ) : (
        <EventFeed initialEvents={data?.recentEvents} />
      )}
    </div>
  );
}
