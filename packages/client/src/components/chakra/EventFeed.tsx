import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import HoloPanel from '../common/HoloPanel';

const ACCENT = '#D4A017';
const MAX_EVENTS = 500;

// ---------------------------------------------------------------------------
// Event Category Colors
// ---------------------------------------------------------------------------

const COMBAT_EVENTS = new Set([
  'Bounty', 'HullDamage', 'ShieldState', 'Died', 'Resurrect',
  'FighterDestroyed', 'UnderAttack', 'ShipTargeted', 'PVPKill',
  'Interdicted', 'Interdiction', 'EscapeInterdiction',
]);

const TRAVEL_EVENTS = new Set([
  'FSDJump', 'StartJump', 'SupercruiseEntry', 'SupercruiseExit',
  'Docked', 'Undocked', 'Liftoff', 'Touchdown', 'ApproachBody',
  'LeaveBody', 'Location', 'CarrierJump', 'DockingGranted',
  'DockingRequested', 'DockingDenied',
]);

const TRADE_EVENTS = new Set([
  'MarketBuy', 'MarketSell', 'BuyTradeData', 'MiningRefined',
  'CollectCargo', 'EjectCargo', 'SearchAndRescue',
]);

const EXPLORE_EVENTS = new Set([
  'Scan', 'FSSDiscoveryScan', 'FSSSignalDiscovered', 'FSSAllBodiesFound',
  'SAAScanComplete', 'SAASignalsFound', 'ScanOrganic', 'CodexEntry',
  'MultiSellExplorationData', 'SellExplorationData',
]);

const SHIP_EVENTS = new Set([
  'Loadout', 'FuelScoop', 'RefuelAll', 'RefuelPartial', 'RepairAll',
  'Repair', 'ModuleBuy', 'ModuleSell', 'EngineerCraft', 'Synthesis',
  'LaunchSRV', 'DockSRV', 'LaunchFighter', 'DockFighter',
  'ShipyardSwap', 'ShipyardBuy', 'SetUserShipName',
]);

function getEventColor(eventName: string): string {
  if (COMBAT_EVENTS.has(eventName)) return '#ff4444';
  if (TRAVEL_EVENTS.has(eventName)) return '#4ecfd0';
  if (TRADE_EVENTS.has(eventName)) return '#d09a4e';
  if (EXPLORE_EVENTS.has(eventName)) return '#4e9a3e';
  if (SHIP_EVENTS.has(eventName)) return ACCENT;
  return '#888888';
}

// ---------------------------------------------------------------------------
// Event Formatters
// ---------------------------------------------------------------------------

function formatEvent(event: Record<string, unknown>): string {
  const e = event;
  switch (e['event'] as string) {
    case 'FSDJump': {
      const sys = e['StarSystem'] as string;
      const dist = e['JumpDist'] as number | undefined;
      const fuel = e['FuelUsed'] as number | undefined;
      return `Jumped to **${sys}**${dist ? ` (${dist.toFixed(1)} LY` : ''}${fuel ? `, ${fuel.toFixed(1)}t fuel)` : dist ? ')' : ''}`;
    }
    case 'StartJump': {
      const jt = e['JumpType'] as string;
      if (jt === 'Hyperspace') {
        const sys = e['StarSystem'] as string;
        const sc = e['StarClass'] as string | undefined;
        return `Charging FSD — ${sys}${sc ? ` (${sc})` : ''}`;
      }
      return 'Entering supercruise';
    }
    case 'SupercruiseEntry':
      return 'Entered supercruise';
    case 'SupercruiseExit': {
      const body = e['Body'] as string | undefined;
      return `Dropped to normal space${body ? ` at ${body}` : ''}`;
    }
    case 'Docked': {
      const station = e['StationName'] as string;
      const sys = e['StarSystem'] as string | undefined;
      return `Docked at **${station}**${sys ? ` in ${sys}` : ''}`;
    }
    case 'Undocked':
      return `Departed **${e['StationName'] as string}**`;
    case 'FuelScoop': {
      const scooped = e['Scooped'] as number;
      const total = e['Total'] as number;
      return `Scooped ${scooped.toFixed(1)}t (${total.toFixed(1)}t total)`;
    }
    case 'Scan': {
      const bodyName = e['BodyName'] as string;
      const planetClass = e['PlanetClass'] as string | undefined;
      const starType = e['StarType'] as string | undefined;
      if (planetClass) return `Scanned **${bodyName}** — ${planetClass}`;
      if (starType) return `Scanned **${bodyName}** — Star (${starType})`;
      return `Scanned **${bodyName}**`;
    }
    case 'FSSDiscoveryScan': {
      const count = e['BodyCount'] as number | undefined;
      return `System scan: ${count ?? '?'} bodies detected`;
    }
    case 'SAAScanComplete': {
      const body = e['BodyName'] as string;
      return `Mapped **${body}**`;
    }
    case 'SAASignalsFound': {
      const body = e['BodyName'] as string;
      return `Signals found on **${body}**`;
    }
    case 'MarketBuy': {
      const type = (e['Type_Localised'] as string) || (e['Type'] as string);
      const count = e['Count'] as number;
      const cost = e['TotalCost'] as number;
      return `Bought ${type} x ${count} for ${cost.toLocaleString()} CR`;
    }
    case 'MarketSell': {
      const type = (e['Type_Localised'] as string) || (e['Type'] as string);
      const count = e['Count'] as number;
      const sale = e['TotalSale'] as number;
      return `Sold ${type} x ${count} for ${sale.toLocaleString()} CR`;
    }
    case 'Bounty': {
      const target = (e['Target_Localised'] as string) || (e['Target'] as string) || 'target';
      const reward = e['TotalReward'] as number;
      return `Bounty: ${target} — ${reward.toLocaleString()} CR`;
    }
    case 'HullDamage': {
      const health = e['Health'] as number;
      return `Hull damage — ${(health * 100).toFixed(0)}% remaining`;
    }
    case 'ShieldState': {
      const up = e['ShieldsUp'] as boolean;
      return up ? 'Shields restored' : 'Shields down!';
    }
    case 'Died': {
      const killer = (e['KillerName_Localised'] as string) || (e['KillerName'] as string);
      return killer ? `Ship destroyed by ${killer}` : 'Ship destroyed';
    }
    case 'Resurrect': {
      const cost = e['Cost'] as number | undefined;
      return `Respawned${cost ? ` (${cost.toLocaleString()} CR rebuy)` : ''}`;
    }
    case 'LaunchSRV':
      return 'SRV deployed';
    case 'DockSRV':
      return 'SRV recovered';
    case 'LaunchFighter':
      return 'Fighter launched';
    case 'DockFighter':
      return 'Fighter recovered';
    case 'Loadout':
      return `Ship loadout: ${(e['ShipName'] as string) || (e['Ship'] as string)}`;
    case 'LoadGame':
      return `Game loaded — CMDR ${e['Commander'] as string}`;
    case 'Location': {
      const sys = e['StarSystem'] as string;
      const station = e['StationName'] as string | undefined;
      return station ? `Location: ${sys} / ${station}` : `Location: ${sys}`;
    }
    case 'Touchdown':
      return `Touched down on ${(e['Body'] as string) || 'surface'}`;
    case 'Liftoff':
      return 'Lifted off from surface';
    case 'RefuelAll':
      return 'Refuelled (full)';
    case 'RepairAll':
      return 'Repaired (full)';
    case 'EngineerCraft': {
      const eng = e['Engineer'] as string;
      const bp = e['BlueprintName'] as string | undefined;
      const lvl = e['Level'] as number | undefined;
      return `Engineering at ${eng}: ${bp ?? 'module'} G${lvl ?? '?'}`;
    }
    case 'MissionAccepted': {
      const name = (e['LocalisedName'] as string) || (e['Name'] as string) || 'mission';
      return `Mission accepted: ${name}`;
    }
    case 'MissionCompleted': {
      const name = (e['LocalisedName'] as string) || (e['Name'] as string) || 'mission';
      const reward = e['Reward'] as number | undefined;
      return `Mission complete: ${name}${reward ? ` — ${reward.toLocaleString()} CR` : ''}`;
    }
    case 'Promotion': {
      const fields = ['Combat', 'Trade', 'Explore', 'CQC', 'Federation', 'Empire'];
      for (const f of fields) {
        if (e[f] !== undefined) return `Promoted: ${f} rank ${e[f]}`;
      }
      return 'Rank promotion';
    }
    case 'MiningRefined':
      return `Refined ${(e['Type_Localised'] as string) || (e['Type'] as string) || 'ore'}`;
    case 'MultiSellExplorationData': {
      const earnings = e['TotalEarnings'] as number | undefined;
      return `Sold exploration data${earnings ? ` — ${earnings.toLocaleString()} CR` : ''}`;
    }
    case 'SellExplorationData': {
      const earnings = e['TotalEarnings'] as number | undefined;
      return `Sold exploration data${earnings ? ` — ${earnings.toLocaleString()} CR` : ''}`;
    }
    case 'Music': {
      const track = e['MusicTrack'] as string;
      return `Music: ${track}`;
    }
    case 'Interdicted': {
      const by = (e['Interdictor_Localised'] as string) || (e['Interdictor'] as string) || 'unknown';
      const submitted = e['Submitted'] as boolean;
      return submitted ? `Submitted to interdiction by ${by}` : `Interdicted by ${by}`;
    }
    case 'EscapeInterdiction':
      return 'Escaped interdiction';
    case 'CarrierJump':
      return `Carrier jumped to ${e['StarSystem'] as string}`;
    default:
      return e['event'] as string;
  }
}

// ---------------------------------------------------------------------------
// Event Row
// ---------------------------------------------------------------------------

interface FeedEvent {
  id: number;
  event: string;
  timestamp: string;
  formatted: string;
  color: string;
}

function EventRow({ entry }: { entry: FeedEvent }) {
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });

  // Render bold text surrounded by ** markers
  const parts = entry.formatted.split(/\*\*(.+?)\*\*/g);

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '4px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      fontSize: 13, lineHeight: 1.6,
      alignItems: 'baseline',
    }}>
      <span style={{
        color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11, flexShrink: 0, minWidth: 64,
      }}>
        {timeStr}
      </span>
      <span style={{
        color: entry.color, fontFamily: 'var(--font-display)',
        fontSize: 11, letterSpacing: 1, flexShrink: 0, minWidth: 130,
        textTransform: 'uppercase',
      }}>
        {entry.event}
      </span>
      <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>
        {parts.map((part, i) =>
          i % 2 === 1
            ? <strong key={i} style={{ color: 'var(--color-text-primary)' }}>{part}</strong>
            : <span key={i}>{part}</span>,
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventFeed
// ---------------------------------------------------------------------------

export default function EventFeed({ initialEvents }: { initialEvents?: Record<string, unknown>[] }) {
  const { subscribe } = useWebSocket();
  const [events, setEvents] = useState<FeedEvent[]>(() => {
    if (!initialEvents) return [];
    return initialEvents.map((e, i) => ({
      id: i,
      event: e['event'] as string,
      timestamp: e['timestamp'] as string,
      formatted: formatEvent(e),
      color: getEventColor(e['event'] as string),
    }));
  });
  const [paused, setPaused] = useState(false);
  const idCounter = useRef(initialEvents?.length ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Subscribe to live events
  useEffect(() => {
    return subscribe('journal:event', (env) => {
      const raw = env.payload as Record<string, unknown>;
      const entry: FeedEvent = {
        id: idCounter.current++,
        event: raw['event'] as string,
        timestamp: raw['timestamp'] as string,
        formatted: formatEvent(raw),
        color: getEventColor(raw['event'] as string),
      };
      setEvents((prev) => {
        const next = [...prev, entry];
        if (next.length > MAX_EVENTS) next.splice(0, next.length - MAX_EVENTS);
        return next;
      });
    });
  }, [subscribe]);

  // Auto-scroll logic
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    autoScrollRef.current = nearBottom;
    setPaused(!nearBottom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !autoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [events]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    autoScrollRef.current = true;
    setPaused(false);
  }, []);

  const clearFeed = useCallback(() => {
    setEvents([]);
  }, []);

  return (
    <HoloPanel title="Live Event Feed" accent={ACCENT}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: 360, overflowY: 'auto', overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `${ACCENT}40 transparent`,
        }}
      >
        {events.length === 0 ? (
          <div style={{
            color: 'var(--color-text-muted)', fontSize: 14,
            textAlign: 'center', padding: '40px 0',
          }}>
            No events yet — waiting for game activity...
          </div>
        ) : (
          events.map((entry) => <EventRow key={entry.id} entry={entry} />)
        )}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {paused && (
            <button
              onClick={scrollToBottom}
              style={{
                background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`,
                color: ACCENT, padding: '3px 10px', borderRadius: 3,
                cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)',
                letterSpacing: 1,
              }}
            >
              AUTO-SCROLL
            </button>
          )}
          <button
            onClick={clearFeed}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)', padding: '3px 10px', borderRadius: 3,
              cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)',
              letterSpacing: 1,
            }}
          >
            CLEAR
          </button>
        </div>
      </div>
    </HoloPanel>
  );
}
