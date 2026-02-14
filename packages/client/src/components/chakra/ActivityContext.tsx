import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import HoloPanel from '../common/HoloPanel';

const ACCENT = '#D4A017';

interface Activity {
  activity: string;
  detail: string | null;
  since: string;
}

export default function ActivityContext({ initial }: { initial?: Activity }) {
  const { subscribe } = useWebSocket();
  const [activity, setActivity] = useState<Activity>(
    initial ?? { activity: 'Idle', detail: null, since: new Date().toISOString() },
  );
  const [location, setLocation] = useState<{
    system?: string;
    station?: string | null;
    body?: string | null;
    docked?: boolean;
    supercruise?: boolean;
  }>({});

  // Derive activity from status:flags and journal:event
  useEffect(() => {
    const unsubs = [
      subscribe('state:location', (env) => {
        const loc = env.payload as typeof location;
        setLocation(loc);
      }),
      subscribe('journal:event', (env) => {
        const event = env.payload as { event: string; timestamp: string } & Record<string, unknown>;
        const derived = deriveActivity(event);
        if (derived) {
          setActivity(derived);
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  const elapsed = getElapsedLabel(activity.since);

  return (
    <HoloPanel title="Activity" accent={ACCENT}>
      <div style={{ minHeight: 60 }}>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 2,
          color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase',
        }}>
          Currently
        </div>
        <div style={{
          fontSize: 22, fontFamily: 'var(--font-display)', color: ACCENT,
          letterSpacing: 1, lineHeight: 1.2,
        }}>
          {activity.activity}
        </div>
        {activity.detail && (
          <div style={{
            fontSize: 14, color: 'var(--color-text-secondary)',
            marginTop: 4,
          }}>
            {activity.detail}
          </div>
        )}
        {location.system && (
          <div style={{
            fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8,
          }}>
            {location.system}
            {location.station ? ` / ${location.station}` : ''}
          </div>
        )}
        <div style={{
          fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6,
          fontStyle: 'italic',
        }}>
          {elapsed}
        </div>
      </div>
    </HoloPanel>
  );
}

function deriveActivity(event: { event: string; timestamp: string } & Record<string, unknown>): Activity | null {
  let activity: string | null = null;
  let detail: string | null = null;

  switch (event.event) {
    case 'FSDJump':
      activity = 'Hyperspace Jump';
      detail = event['StarSystem'] as string ?? null;
      break;
    case 'StartJump':
      if (event['JumpType'] === 'Hyperspace') {
        activity = 'Charging FSD';
        detail = event['StarSystem'] as string ?? null;
      } else {
        activity = 'Entering Supercruise';
      }
      break;
    case 'SupercruiseEntry':
      activity = 'Supercruise';
      detail = event['StarSystem'] as string ?? null;
      break;
    case 'SupercruiseExit':
      activity = 'Normal Space';
      detail = event['Body'] as string ?? null;
      break;
    case 'Docked':
      activity = 'Docked';
      detail = event['StationName'] as string ?? null;
      break;
    case 'Undocked':
      activity = 'Departing';
      detail = event['StationName'] as string ?? null;
      break;
    case 'Touchdown':
      activity = 'Landed';
      detail = event['Body'] as string ?? null;
      break;
    case 'LaunchSRV':
      activity = 'SRV Deployed';
      break;
    case 'DockSRV':
      activity = 'SRV Recovered';
      break;
    case 'HullDamage':
      activity = 'Taking Damage!';
      detail = `${((event['Health'] as number ?? 1) * 100).toFixed(0)}% hull`;
      break;
    case 'ShieldState':
      if (event['ShieldsUp'] === false) activity = 'Under Attack!';
      break;
    case 'FSSDiscoveryScan':
      activity = 'Scanning System';
      break;
    case 'SAASignalsFound':
      activity = 'Mapping';
      detail = event['BodyName'] as string ?? null;
      break;
    case 'Scan':
      activity = 'Scanning';
      detail = event['BodyName'] as string ?? null;
      break;
    case 'MarketBuy':
    case 'MarketSell':
      activity = 'Trading';
      break;
    case 'Died':
      activity = 'Ship Destroyed';
      break;
    case 'Music': {
      const track = event['MusicTrack'] as string;
      if (track?.includes('Combat')) activity = 'Combat';
      else if (track === 'Supercruise') activity = 'Supercruise';
      else if (track === 'Exploration') activity = 'Exploring';
      break;
    }
    default:
      return null;
  }

  if (!activity) return null;
  return { activity, detail, since: event.timestamp };
}

function getElapsedLabel(since: string): string {
  const diffMs = Date.now() - new Date(since).getTime();
  if (diffMs < 0) return 'just now';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}
