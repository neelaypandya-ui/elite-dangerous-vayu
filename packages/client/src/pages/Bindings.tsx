/**
 * @vayu/client -- HOTAS Binding Visualizer & Editor
 *
 * Comprehensive page for viewing, searching, and editing Elite Dangerous
 * key bindings, HOTAS mappings, and controller configuration. Features:
 *
 *   1. Input Monitor           -- real-time gamepad input visualization
 *   2. Device Overview Panel   -- detected devices with binding counts
 *   3. Visual Device Maps      -- photo-based views of Warthog Throttle + VKB NXT
 *   4. Category Browser        -- tabbed table of bindings per category
 *   5. Search                  -- filter bindings by action name
 *   6. Binding Editor          -- click-to-rebind modal with live HOTAS input
 *   7. Conflicts Panel         -- duplicate key mappings with warnings
 *   8. Unbound Actions Panel   -- collapsible list of unassigned actions
 *
 * Fetches data from /api/bindings on mount. Styled with Elite Dangerous
 * dark theme using CSS custom properties from globals.css.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useGamepad } from '../hooks/useGamepad';
import { useWebSocket } from '../hooks/useWebSocket';
import { InputMonitor } from '../components/bindings/InputMonitor';
import { BindingEditor } from '../components/bindings/BindingEditor';
import { BindingWizard } from '../components/bindings/wizard/BindingWizard';

// ---------------------------------------------------------------------------
// Types (mirrors server response shapes)
// ---------------------------------------------------------------------------

interface BindingModifier {
  device: string;
  key: string;
}

interface KeyBinding {
  device: string;
  deviceType: string;
  key: string;
  modifiers: BindingModifier[];
}

interface AxisBinding {
  device: string;
  deviceType: string;
  axis: string;
  inverted: boolean;
  deadzone: number;
}

interface BindingEntry {
  action: string;
  category: string;
  primary: KeyBinding | null;
  secondary: KeyBinding | null;
  axis: AxisBinding | null;
}

interface DeviceInfo {
  id: string;
  label: string;
  type: string;
}

interface CategoryInfo {
  category: string;
  count: number;
}

interface BindingsData {
  name: string;
  filePath: string;
  majorVersion: string;
  minorVersion: string;
  totalBindings: number;
  boundActions: number;
  unboundActions: number;
  devices: DeviceInfo[];
  categories: CategoryInfo[];
  bindings: Record<string, BindingEntry>;
}

interface ConflictEntry {
  key: string;
  device: string;
  actions: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Colour map for binding categories. */
const CATEGORY_COLORS: Record<string, string> = {
  flight_rotation: '#4e9a3e',
  flight_thrust: '#3ea97a',
  flight_throttle: '#5cb85c',
  flight_miscellaneous: '#6fcf5c',
  targeting: '#4e9ad0',
  weapons: '#ff4444',
  cooling: '#d04e9a',
  miscellaneous: '#8899aa',
  mode_switches: '#b080ff',
  headlook: '#9a7a4e',
  galaxy_map: '#4e7a9a',
  system_map: '#4e7a9a',
  camera_suite: '#9a4e7a',
  interface: '#7a9a4e',
  driving: '#d09a4e',
  driving_targeting: '#d07a4e',
  driving_throttle: '#d0ba4e',
  driving_miscellaneous: '#aa8844',
  multi_crew: '#9a4ed0',
  fighter_orders: '#d04e4e',
  store: '#888888',
  holo_me: '#888888',
  on_foot: '#4ecfd0',
  on_foot_combat: '#cf4e4e',
  on_foot_social: '#4ecf9a',
  on_foot_inventory: '#cfcf4e',
  fss_mode: '#4e9ad0',
  saa_mode: '#4ed0d0',
};

/** Human-readable labels for binding categories. */
const CATEGORY_LABELS: Record<string, string> = {
  flight_rotation: 'Flight Rotation',
  flight_thrust: 'Flight Thrust',
  flight_throttle: 'Flight Throttle',
  flight_miscellaneous: 'Flight Misc',
  targeting: 'Targeting',
  weapons: 'Weapons',
  cooling: 'Cooling / Defence',
  miscellaneous: 'Miscellaneous',
  mode_switches: 'Mode Switches',
  headlook: 'Head Look',
  galaxy_map: 'Galaxy Map',
  system_map: 'System Map',
  camera_suite: 'Camera Suite',
  interface: 'Interface / UI',
  driving: 'SRV Driving',
  driving_targeting: 'SRV Targeting',
  driving_throttle: 'SRV Throttle',
  driving_miscellaneous: 'SRV Misc',
  multi_crew: 'Multi-Crew',
  fighter_orders: 'Fighter Orders',
  store: 'Store',
  holo_me: 'Holo-Me',
  on_foot: 'On Foot',
  on_foot_combat: 'On Foot Combat',
  on_foot_social: 'On Foot Social',
  on_foot_inventory: 'On Foot Inventory',
  fss_mode: 'FSS Mode',
  saa_mode: 'SAA / DSS Mode',
};

/** Colour map for devices. */
const DEVICE_COLORS: Record<string, string> = {
  Keyboard: '#8899aa',
  Mouse: '#aa88aa',
  ThrustMasterWarthogThrottle: '#ff8c00',
  GamePad: '#4e9ad0',
};

function getDeviceColor(deviceId: string): string {
  return DEVICE_COLORS[deviceId] || '#6fcf5c';
}

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#8899aa';
}

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Make a raw key identifier human-readable. */
function formatKey(key: string): string {
  if (!key) return '';
  return key
    .replace(/^Key_/, '')
    .replace(/^Joy_/, 'Btn ')
    .replace(/^Pos_Joy_/, '+')
    .replace(/^Neg_Joy_/, '-')
    .replace(/Axis/, ' Axis')
    .replace(/^Joy_POV/, 'POV')
    .replace(/Button$/, '')
    .replace(/_/g, ' ');
}

/** Format a binding (key + modifiers) as a readable string. */
function formatBinding(binding: KeyBinding | null): string {
  if (!binding) return '--';
  const parts: string[] = [];
  for (const mod of binding.modifiers) {
    parts.push(formatKey(mod.key));
  }
  parts.push(formatKey(binding.key));
  return parts.join(' + ');
}

/** Format an axis binding as a readable string. */
function formatAxis(axis: AxisBinding | null): string {
  if (!axis) return '';
  const inv = axis.inverted ? ' (inv)' : '';
  return `${formatKey(axis.axis)}${inv}`;
}

/** Convert a PascalCase action name to a readable label. */
function formatAction(action: string): string {
  return action
    .replace(/([A-Z])/g, ' $1')
    .replace(/^ /, '')
    .replace(/_/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const s = {
  page: {
    height: '100%',
    width: '100%',
    padding: 'var(--space-xl)',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  header: {
    marginBottom: 'var(--space-lg)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-accent-bright)',
    textShadow: '0 0 20px rgba(78, 154, 62, 0.3)',
    margin: 0,
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-muted)',
    fontSize: '0.85rem',
    marginTop: 'var(--space-xs)',
  },
  // Search bar
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px',
    padding: 'var(--space-sm) var(--space-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  // Devices overview
  devicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)',
  },
  deviceCard: {
    background: 'var(--color-bg-panel)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  deviceCardActive: {
    borderColor: 'var(--color-accent-bright)',
    boxShadow: '0 0 12px rgba(78, 154, 62, 0.2)',
  },
  deviceLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-xs)',
  },
  deviceId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  deviceCount: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    color: 'var(--color-accent-bright)',
    marginTop: 'var(--space-sm)',
  },
  deviceAccent: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
  },
  // Section headers
  sectionHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--color-accent)',
    marginBottom: 'var(--space-md)',
    paddingBottom: 'var(--space-sm)',
    borderBottom: '1px solid var(--color-border)',
  },
  // Category tabs
  tabsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-xs)',
    marginBottom: 'var(--space-md)',
  },
  tab: {
    padding: '4px var(--space-sm)',
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    borderColor: 'var(--color-accent-bright)',
    color: 'var(--color-accent-bright)',
    background: 'var(--color-accent-dim)',
  },
  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
  },
  th: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-accent)',
    textAlign: 'left' as const,
    padding: 'var(--space-sm) var(--space-md)',
    borderBottom: '1px solid var(--color-border-bright)',
    position: 'sticky' as const,
    top: 0,
    background: 'var(--color-bg-panel)',
    zIndex: 1,
  },
  td: {
    padding: 'var(--space-xs) var(--space-md)',
    borderBottom: '1px solid rgba(30, 58, 46, 0.2)',
    color: 'var(--color-text-primary)',
    verticalAlign: 'top' as const,
  },
  tdDevice: {
    padding: 'var(--space-xs) var(--space-md)',
    borderBottom: '1px solid rgba(30, 58, 46, 0.2)',
    verticalAlign: 'top' as const,
    fontSize: '0.7rem',
  },
  // Panel
  panel: {
    background: 'var(--color-bg-panel)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  panelHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-accent)',
    paddingBottom: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--color-border)',
  },
  // SVG device maps
  deviceMapContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)',
  },
  svgPanel: {
    background: 'var(--color-bg-panel)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  // Conflicts
  conflictItem: {
    background: 'rgba(255, 68, 68, 0.05)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    marginBottom: 'var(--space-sm)',
  },
  conflictKey: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--color-danger)',
    marginBottom: '4px',
  },
  conflictActions: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
  },
  // Unbound
  unboundToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    marginBottom: 'var(--space-md)',
  },
  unboundList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 'var(--space-xs)',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  unboundItem: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    padding: '2px var(--space-sm)',
  },
  // Highlight match
  highlightMatch: {
    background: 'rgba(78, 154, 62, 0.25)',
    color: 'var(--color-accent-bright)',
    borderRadius: '2px',
    padding: '0 2px',
  },
  // Loading / error
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 'var(--space-md)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-border)',
    borderTop: '3px solid var(--color-accent-bright)',
    borderRadius: '50%',
    animation: 'spin 1.2s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-secondary)',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 'var(--space-md)',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--color-danger)',
    textAlign: 'center' as const,
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    border: '1px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-accent-bright)',
    cursor: 'pointer',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)',
  },
  badge: {
    display: 'inline-block',
    padding: '1px 6px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.55rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
  },
} as const;

// ---------------------------------------------------------------------------
// ControlGroup -- compact card showing a titled group of label/binding pairs
// ---------------------------------------------------------------------------

function ControlGroup({ title, items, color, highlightedKey, onClickItem }: {
  title: string;
  items: { label: string; binding: string; eliteDevice?: string; eliteKey?: string; action?: string }[];
  color: string;
  highlightedKey?: { device: string; key: string } | null;
  onClickItem?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  // Check if any item in this group matches the highlighted key
  const isHighlighted = highlightedKey && items.some(
    (item) =>
      item.eliteDevice &&
      item.eliteKey &&
      item.eliteDevice.toLowerCase() === highlightedKey.device.toLowerCase() &&
      item.eliteKey.toLowerCase() === highlightedKey.key.toLowerCase(),
  );

  return (
    <div style={{
      background: 'rgba(10, 14, 20, 0.85)',
      border: `1px solid ${isHighlighted ? color : `${color}30`}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 4,
      padding: '6px 10px',
      flex: '1 1 150px',
      minWidth: 140,
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: isHighlighted ? `0 0 12px ${color}40, inset 0 0 8px ${color}15` : 'none',
    }}>
      <div style={{
        fontSize: '0.6rem',
        fontFamily: "'Orbitron', sans-serif",
        color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        marginBottom: 3,
      }}>
        {title}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: '0.68rem',
            fontFamily: "'Share Tech Mono', monospace",
            lineHeight: '1.4',
            cursor: onClickItem && item.action ? 'pointer' : 'default',
            borderRadius: 2,
            padding: '0 2px',
            transition: 'background 0.15s',
          }}
          onClick={() => {
            if (onClickItem && item.action) {
              onClickItem(item.action, 'primary', formatAction(item.action), item.binding);
            }
          }}
          onMouseEnter={(e) => {
            if (onClickItem && item.action) {
              (e.currentTarget as HTMLElement).style.background = `${color}15`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <span style={{ color: `${color}99`, whiteSpace: 'nowrap' as const }}>{item.label}</span>
          <span style={{
            color: item.binding === '--' ? '#555' : '#d0d0d0',
            textAlign: 'right' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {item.binding === '--' ? '\u2014' : item.binding}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HatGroup -- specialized wrapper for 4-way hat switches
// ---------------------------------------------------------------------------

function HatGroup({ title, color, up, down, left, right, eliteDevice, eliteKeys, actions, highlightedKey, onClickItem }: {
  title: string;
  color: string;
  up: string;
  down: string;
  left: string;
  right: string;
  eliteDevice?: string;
  eliteKeys?: { up: string; down: string; left: string; right: string };
  actions?: { up?: string; down?: string; left?: string; right?: string };
  highlightedKey?: { device: string; key: string } | null;
  onClickItem?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  return (
    <ControlGroup
      title={title}
      color={color}
      highlightedKey={highlightedKey}
      onClickItem={onClickItem}
      items={[
        { label: '\u2191', binding: up, eliteDevice, eliteKey: eliteKeys?.up, action: actions?.up },
        { label: '\u2193', binding: down, eliteDevice, eliteKey: eliteKeys?.down, action: actions?.down },
        { label: '\u2190', binding: left, eliteDevice, eliteKey: eliteKeys?.left, action: actions?.left },
        { label: '\u2192', binding: right, eliteDevice, eliteKey: eliteKeys?.right, action: actions?.right },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Device map: Thrustmaster Warthog Throttle (photo-based)
// ---------------------------------------------------------------------------

function WarthogThrottleMap({ bindings, findAction, highlightedKey, onClickItem }: {
  bindings: Record<string, BindingEntry>;
  findAction: (device: string, key: string) => string;
  highlightedKey?: { device: string; key: string } | null;
  onClickItem?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  const dev = 'ThrustMasterWarthogThrottle';
  const find = (key: string) => findAction(dev, key);
  const hl = highlightedKey?.device.toLowerCase() === dev.toLowerCase() ? highlightedKey : null;

  // Look up the raw action name for a device+key combo
  const actionName = (key: string): string | undefined => {
    const dLower = dev.toLowerCase();
    const kLower = key.toLowerCase();
    for (const entry of Object.values(bindings)) {
      if (entry.primary?.device.toLowerCase() === dLower && entry.primary.key.toLowerCase() === kLower) return entry.action;
      if (entry.secondary?.device.toLowerCase() === dLower && entry.secondary.key.toLowerCase() === kLower) return entry.action;
      if (entry.axis?.device.toLowerCase() === dLower && entry.axis.axis.toLowerCase() === kLower) return entry.action;
    }
    return undefined;
  };

  const sectionLabel = {
    fontSize: '0.55rem',
    fontFamily: "'Orbitron', sans-serif",
    color: 'rgba(78,154,62,0.5)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  };

  return (
    <div style={s.svgPanel}>
      <div style={s.panelHeader}>Thrustmaster Warthog Throttle</div>

      {/* Device photo */}
      <div style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 14,
        background: '#0a0e14',
      }}>
        <img
          src="/assets/devices/warthog-throttle.png"
          alt="Thrustmaster Warthog Throttle"
          style={{ width: '100%', display: 'block', filter: 'brightness(0.55)' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(10,14,20,0) 50%, rgba(10,14,20,0.5) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Hat Switches */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Hat Switches</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <HatGroup
            title="Coolie Hat (POV1)"
            color="#4e9a3e"
            up={find('Joy_POV1Up')}
            down={find('Joy_POV1Down')}
            left={find('Joy_POV1Left')}
            right={find('Joy_POV1Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV1Up', down: 'Joy_POV1Down', left: 'Joy_POV1Left', right: 'Joy_POV1Right' }}
            actions={{ up: actionName('Joy_POV1Up'), down: actionName('Joy_POV1Down'), left: actionName('Joy_POV1Left'), right: actionName('Joy_POV1Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
          <HatGroup
            title="China Hat (POV2)"
            color="#4e9ad0"
            up={find('Joy_POV2Up')}
            down={find('Joy_POV2Down')}
            left={find('Joy_POV2Left')}
            right={find('Joy_POV2Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV2Up', down: 'Joy_POV2Down', left: 'Joy_POV2Left', right: 'Joy_POV2Right' }}
            actions={{ up: actionName('Joy_POV2Up'), down: actionName('Joy_POV2Down'), left: actionName('Joy_POV2Left'), right: actionName('Joy_POV2Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
          <HatGroup
            title="MIC Switch (POV3)"
            color="#b080ff"
            up={find('Joy_POV3Up')}
            down={find('Joy_POV3Down')}
            left={find('Joy_POV3Left')}
            right={find('Joy_POV3Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV3Up', down: 'Joy_POV3Down', left: 'Joy_POV3Left', right: 'Joy_POV3Right' }}
            actions={{ up: actionName('Joy_POV3Up'), down: actionName('Joy_POV3Down'), left: actionName('Joy_POV3Left'), right: actionName('Joy_POV3Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
          <HatGroup
            title="TMS Hat (POV4)"
            color="#ff4444"
            up={find('Joy_POV4Up')}
            down={find('Joy_POV4Down')}
            left={find('Joy_POV4Left')}
            right={find('Joy_POV4Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV4Up', down: 'Joy_POV4Down', left: 'Joy_POV4Left', right: 'Joy_POV4Right' }}
            actions={{ up: actionName('Joy_POV4Up'), down: actionName('Joy_POV4Down'), left: actionName('Joy_POV4Left'), right: actionName('Joy_POV4Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
          <HatGroup
            title="DMS Hat"
            color="#d04e9a"
            up={find('Joy_9')}
            down={find('Joy_10')}
            left={find('Joy_11')}
            right={find('Joy_12')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_9', down: 'Joy_10', left: 'Joy_11', right: 'Joy_12' }}
            actions={{ up: actionName('Joy_9'), down: actionName('Joy_10'), left: actionName('Joy_11'), right: actionName('Joy_12') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
        </div>
      </div>

      {/* Axes & Controls */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Axes & Controls</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Slew Control"
            color="#ff8c00"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'X Axis', binding: find('Joy_XAxis'), eliteDevice: dev, eliteKey: 'Joy_XAxis', action: actionName('Joy_XAxis') },
              { label: 'Y Axis', binding: find('Joy_YAxis'), eliteDevice: dev, eliteKey: 'Joy_YAxis', action: actionName('Joy_YAxis') },
            ]}
          />
          <ControlGroup
            title="Throttle"
            color="#ff8c00"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Fwd', binding: find('Pos_Joy_ZAxis'), eliteDevice: dev, eliteKey: 'Pos_Joy_ZAxis', action: actionName('Pos_Joy_ZAxis') },
              { label: 'Rev', binding: find('Neg_Joy_ZAxis'), eliteDevice: dev, eliteKey: 'Neg_Joy_ZAxis', action: actionName('Neg_Joy_ZAxis') },
            ]}
          />
        </div>
      </div>

      {/* Toggle Switches */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Toggle Switches</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Toggle Row A"
            color="#6fcf5c"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'EAC', binding: find('Joy_25'), eliteDevice: dev, eliteKey: 'Joy_25', action: actionName('Joy_25') },
              { label: 'RDR', binding: find('Joy_26'), eliteDevice: dev, eliteKey: 'Joy_26', action: actionName('Joy_26') },
              { label: 'AP', binding: find('Joy_27'), eliteDevice: dev, eliteKey: 'Joy_27', action: actionName('Joy_27') },
              { label: 'LASTE', binding: find('Joy_28'), eliteDevice: dev, eliteKey: 'Joy_28', action: actionName('Joy_28') },
            ]}
          />
          <ControlGroup
            title="Toggle Row B"
            color="#5cb85c"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Flap Up', binding: find('Joy_21'), eliteDevice: dev, eliteKey: 'Joy_21', action: actionName('Joy_21') },
              { label: 'Flap Dn', binding: find('Joy_22'), eliteDevice: dev, eliteKey: 'Joy_22', action: actionName('Joy_22') },
              { label: 'ENG L', binding: find('Joy_23'), eliteDevice: dev, eliteKey: 'Joy_23', action: actionName('Joy_23') },
              { label: 'ENG R', binding: find('Joy_24'), eliteDevice: dev, eliteKey: 'Joy_24', action: actionName('Joy_24') },
            ]}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Buttons</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Special"
            color="#9a4ed0"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Pinky', binding: find('Joy_15'), eliteDevice: dev, eliteKey: 'Joy_15', action: actionName('Joy_15') },
              { label: 'Spd Brk', binding: find('Joy_POV3Push'), eliteDevice: dev, eliteKey: 'Joy_POV3Push', action: actionName('Joy_POV3Push') },
            ]}
          />
          <ControlGroup
            title="Base Buttons"
            color="#8899aa"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'B1', binding: find('Joy_1'), eliteDevice: dev, eliteKey: 'Joy_1', action: actionName('Joy_1') },
              { label: 'B2', binding: find('Joy_2'), eliteDevice: dev, eliteKey: 'Joy_2', action: actionName('Joy_2') },
              { label: 'B3', binding: find('Joy_3'), eliteDevice: dev, eliteKey: 'Joy_3', action: actionName('Joy_3') },
              { label: 'B4', binding: find('Joy_4'), eliteDevice: dev, eliteKey: 'Joy_4', action: actionName('Joy_4') },
              { label: 'B5', binding: find('Joy_5'), eliteDevice: dev, eliteKey: 'Joy_5', action: actionName('Joy_5') },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Device map: VKB Gladiator NXT EVO (photo-based)
// ---------------------------------------------------------------------------

function VkbStickMap({ bindings, findAction, highlightedKey, onClickItem }: {
  bindings: Record<string, BindingEntry>;
  findAction: (device: string, key: string) => string;
  highlightedKey?: { device: string; key: string } | null;
  onClickItem?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  const dev = 'GamePad';
  const find = (key: string) => findAction(dev, key);
  const hl = highlightedKey?.device.toLowerCase() === dev.toLowerCase() ? highlightedKey : null;

  const actionName = (key: string): string | undefined => {
    const dLower = dev.toLowerCase();
    const kLower = key.toLowerCase();
    for (const entry of Object.values(bindings)) {
      if (entry.primary?.device.toLowerCase() === dLower && entry.primary.key.toLowerCase() === kLower) return entry.action;
      if (entry.secondary?.device.toLowerCase() === dLower && entry.secondary.key.toLowerCase() === kLower) return entry.action;
      if (entry.axis?.device.toLowerCase() === dLower && entry.axis.axis.toLowerCase() === kLower) return entry.action;
    }
    return undefined;
  };

  const sectionLabel = {
    fontSize: '0.55rem',
    fontFamily: "'Orbitron', sans-serif",
    color: 'rgba(78,154,62,0.5)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  };

  return (
    <div style={s.svgPanel}>
      <div style={s.panelHeader}>VKB Gladiator NXT EVO</div>

      {/* Device photo */}
      <div style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 14,
        background: '#0a0e14',
      }}>
        <img
          src="/assets/devices/vkb-nxt-evo.png"
          alt="VKB Gladiator NXT EVO"
          style={{ width: '100%', display: 'block', filter: 'brightness(0.55)' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(10,14,20,0) 50%, rgba(10,14,20,0.5) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Stick Axes */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Stick Axes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Primary Axes"
            color="#4e9ad0"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Roll', binding: find('Joy_XAxis'), eliteDevice: dev, eliteKey: 'Joy_XAxis', action: actionName('Joy_XAxis') },
              { label: 'Pitch', binding: find('Joy_YAxis'), eliteDevice: dev, eliteKey: 'Joy_YAxis', action: actionName('Joy_YAxis') },
              { label: 'Yaw/Twist', binding: find('Joy_RZAxis'), eliteDevice: dev, eliteKey: 'Joy_RZAxis', action: actionName('Joy_RZAxis') },
            ]}
          />
        </div>
      </div>

      {/* Hat Switches */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Hat Switches</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <HatGroup
            title="Hat 1 Stick (POV1)"
            color="#4e9a3e"
            up={find('Joy_POV1Up')}
            down={find('Joy_POV1Down')}
            left={find('Joy_POV1Left')}
            right={find('Joy_POV1Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV1Up', down: 'Joy_POV1Down', left: 'Joy_POV1Left', right: 'Joy_POV1Right' }}
            actions={{ up: actionName('Joy_POV1Up'), down: actionName('Joy_POV1Down'), left: actionName('Joy_POV1Left'), right: actionName('Joy_POV1Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
          <HatGroup
            title="Hat 2 Base (POV2)"
            color="#d09a4e"
            up={find('Joy_POV2Up')}
            down={find('Joy_POV2Down')}
            left={find('Joy_POV2Left')}
            right={find('Joy_POV2Right')}
            eliteDevice={dev}
            eliteKeys={{ up: 'Joy_POV2Up', down: 'Joy_POV2Down', left: 'Joy_POV2Left', right: 'Joy_POV2Right' }}
            actions={{ up: actionName('Joy_POV2Up'), down: actionName('Joy_POV2Down'), left: actionName('Joy_POV2Left'), right: actionName('Joy_POV2Right') }}
            highlightedKey={hl}
            onClickItem={onClickItem}
          />
        </div>
      </div>

      {/* Stick Buttons */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Stick Buttons</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Trigger & Grip"
            color="#ff4444"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Trigger', binding: find('Joy_1'), eliteDevice: dev, eliteKey: 'Joy_1', action: actionName('Joy_1') },
              { label: 'Side', binding: find('Joy_2'), eliteDevice: dev, eliteKey: 'Joy_2', action: actionName('Joy_2') },
              { label: 'Side 2', binding: find('Joy_3'), eliteDevice: dev, eliteKey: 'Joy_3', action: actionName('Joy_3') },
            ]}
          />
          <ControlGroup
            title="Thumb & Pinky"
            color="#b080ff"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'Thumb', binding: find('Joy_4'), eliteDevice: dev, eliteKey: 'Joy_4', action: actionName('Joy_4') },
              { label: 'Pinky', binding: find('Joy_5'), eliteDevice: dev, eliteKey: 'Joy_5', action: actionName('Joy_5') },
            ]}
          />
        </div>
      </div>

      {/* Base Buttons */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionLabel}>Base Buttons</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlGroup
            title="Base Row 1"
            color="#8899aa"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'B6', binding: find('Joy_6'), eliteDevice: dev, eliteKey: 'Joy_6', action: actionName('Joy_6') },
              { label: 'B7', binding: find('Joy_7'), eliteDevice: dev, eliteKey: 'Joy_7', action: actionName('Joy_7') },
              { label: 'B8', binding: find('Joy_8'), eliteDevice: dev, eliteKey: 'Joy_8', action: actionName('Joy_8') },
              { label: 'B9', binding: find('Joy_9'), eliteDevice: dev, eliteKey: 'Joy_9', action: actionName('Joy_9') },
            ]}
          />
          <ControlGroup
            title="Base Row 2"
            color="#556677"
            highlightedKey={hl}
            onClickItem={onClickItem}
            items={[
              { label: 'B10', binding: find('Joy_10'), eliteDevice: dev, eliteKey: 'Joy_10', action: actionName('Joy_10') },
              { label: 'B11', binding: find('Joy_11'), eliteDevice: dev, eliteKey: 'Joy_11', action: actionName('Joy_11') },
              { label: 'B12', binding: find('Joy_12'), eliteDevice: dev, eliteKey: 'Joy_12', action: actionName('Joy_12') },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight search matches in text
// ---------------------------------------------------------------------------

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span style={s.highlightMatch}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bindings Table
// ---------------------------------------------------------------------------

function BindingsTable({ entries, searchQuery, onClickBinding }: {
  entries: BindingEntry[];
  searchQuery: string;
  onClickBinding?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-md)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
        No bindings found
      </div>
    );
  }

  const clickableTd = onClickBinding
    ? { ...s.td, cursor: 'pointer', transition: 'background 0.15s' }
    : s.td;

  return (
    <div style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Action</th>
            <th style={s.th}>Category</th>
            <th style={s.th}>Primary</th>
            <th style={s.th}>Secondary</th>
            <th style={s.th}>Axis</th>
            <th style={s.th}>Device</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const primaryDevice = entry.primary?.device || '';
            const secondaryDevice = entry.secondary?.device || '';
            const axisDevice = entry.axis?.device || '';
            const mainDevice = primaryDevice || axisDevice || secondaryDevice;
            const label = formatAction(entry.action);

            return (
              <tr key={entry.action} style={{ transition: 'background 0.15s' }}>
                <td style={s.td}>
                  <HighlightText text={label} query={searchQuery} />
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.badge,
                    borderColor: getCategoryColor(entry.category),
                    color: getCategoryColor(entry.category),
                  }}>
                    {getCategoryLabel(entry.category)}
                  </span>
                </td>
                <td
                  style={clickableTd}
                  onClick={() => onClickBinding?.(entry.action, 'primary', label, entry.primary ? formatBinding(entry.primary) : '--')}
                  onMouseEnter={(e) => { if (onClickBinding) (e.currentTarget as HTMLElement).style.background = 'rgba(78, 154, 62, 0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  {entry.primary ? formatBinding(entry.primary) : '--'}
                </td>
                <td
                  style={clickableTd}
                  onClick={() => onClickBinding?.(entry.action, 'secondary', label, entry.secondary ? formatBinding(entry.secondary) : '--')}
                  onMouseEnter={(e) => { if (onClickBinding) (e.currentTarget as HTMLElement).style.background = 'rgba(78, 154, 62, 0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  {entry.secondary ? formatBinding(entry.secondary) : '--'}
                </td>
                <td
                  style={clickableTd}
                  onClick={() => onClickBinding?.(entry.action, 'axis', label, entry.axis ? formatAxis(entry.axis) : '--')}
                  onMouseEnter={(e) => { if (onClickBinding) (e.currentTarget as HTMLElement).style.background = 'rgba(78, 154, 62, 0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  {entry.axis ? formatAxis(entry.axis) : '--'}
                </td>
                <td style={{ ...s.tdDevice, color: getDeviceColor(mainDevice) }}>
                  {mainDevice || '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Device Overview Panel
// ---------------------------------------------------------------------------

function DeviceOverview({
  devices,
  bindings,
  selectedDevice,
  onSelectDevice,
}: {
  devices: DeviceInfo[];
  bindings: Record<string, BindingEntry>;
  selectedDevice: string | null;
  onSelectDevice: (id: string | null) => void;
}) {
  // Count bindings per device
  const deviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of Object.values(bindings)) {
      if (entry.primary) {
        counts[entry.primary.device] = (counts[entry.primary.device] || 0) + 1;
      }
      if (entry.secondary) {
        counts[entry.secondary.device] = (counts[entry.secondary.device] || 0) + 1;
      }
      if (entry.axis) {
        counts[entry.axis.device] = (counts[entry.axis.device] || 0) + 1;
      }
    }
    return counts;
  }, [bindings]);

  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={s.sectionHeader}>Detected Devices</div>
      <div style={s.devicesGrid}>
        {devices.map((dev) => {
          const isActive = selectedDevice === dev.id;
          const color = getDeviceColor(dev.id);
          return (
            <div
              key={dev.id}
              style={{
                ...s.deviceCard,
                ...(isActive ? s.deviceCardActive : {}),
                borderColor: isActive ? color : 'var(--color-border)',
              }}
              className="animate-slide-up"
              onClick={() => onSelectDevice(isActive ? null : dev.id)}
            >
              <div style={{ ...s.deviceAccent, background: color }} />
              <div style={s.deviceLabel}>{dev.label}</div>
              <div style={s.deviceId}>{dev.id}</div>
              <div style={{ ...s.deviceCount, color }}>{deviceCounts[dev.id] || 0}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                bindings
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Browser (tabs + table)
// ---------------------------------------------------------------------------

function CategoryBrowser({
  categories,
  bindings,
  searchQuery,
  onClickBinding,
}: {
  categories: CategoryInfo[];
  bindings: Record<string, BindingEntry>;
  searchQuery: string;
  onClickBinding?: (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Sort categories by count descending
  const sorted = useMemo(
    () => [...categories].sort((a, b) => b.count - a.count),
    [categories],
  );

  // Filter entries for the active category
  const filteredEntries = useMemo(() => {
    if (!activeCategory) return [];
    return Object.values(bindings).filter((e) => e.category === activeCategory);
  }, [bindings, activeCategory]);

  return (
    <div style={s.panel}>
      <div style={s.panelHeader}>Category Browser</div>
      <div style={s.tabsContainer}>
        {sorted.map((cat) => {
          const isActive = activeCategory === cat.category;
          const color = getCategoryColor(cat.category);
          return (
            <button
              key={cat.category}
              style={{
                ...s.tab,
                ...(isActive ? { ...s.tabActive, borderColor: color, color } : {}),
              }}
              onClick={() => setActiveCategory(isActive ? null : cat.category)}
            >
              {getCategoryLabel(cat.category)} ({cat.count})
            </button>
          );
        })}
      </div>
      {activeCategory && (
        <BindingsTable entries={filteredEntries} searchQuery={searchQuery} onClickBinding={onClickBinding} />
      )}
      {!activeCategory && (
        <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-md)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
          Select a category above to view its bindings
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conflicts Panel
// ---------------------------------------------------------------------------

function ConflictsPanel({ conflicts }: { conflicts: ConflictEntry[] }) {
  if (conflicts.length === 0) {
    return (
      <div style={s.panel}>
        <div style={s.panelHeader}>Binding Conflicts</div>
        <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-md)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
          No conflicts detected
        </div>
      </div>
    );
  }

  return (
    <div style={s.panel}>
      <div style={{ ...s.panelHeader, color: 'var(--color-warning)' }}>
        Binding Conflicts ({conflicts.length})
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {conflicts.map((c, i) => (
          <div key={i} style={s.conflictItem}>
            <div style={s.conflictKey}>
              {formatKey(c.key)} on {c.device}
            </div>
            <div style={s.conflictActions}>
              {c.actions.map((a) => formatAction(a)).join('  /  ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unbound Actions Panel
// ---------------------------------------------------------------------------

function UnboundPanel({ actions }: { actions: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (actions.length === 0) {
    return (
      <div style={s.panel}>
        <div style={s.panelHeader}>Unbound Actions</div>
        <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-md)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
          All actions are bound
        </div>
      </div>
    );
  }

  return (
    <div style={s.panel}>
      <div style={s.panelHeader}>Unbound Actions ({actions.length})</div>
      <button
        style={s.unboundToggle}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Collapse' : 'Expand'} ({actions.length} actions)
      </button>
      {expanded && (
        <div style={s.unboundList}>
          {actions.map((a) => (
            <div key={a} style={s.unboundItem}>
              {formatAction(a)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Bindings() {
  const [data, setData] = useState<BindingsData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [unboundActions, setUnboundActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Gamepad integration
  const [highlightedKey, setHighlightedKey] = useState<{ device: string; key: string } | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Binding wizard state
  const [wizardOpen, setWizardOpen] = useState(false);

  // Binding editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAction, setEditorAction] = useState('');
  const [editorSlot, setEditorSlot] = useState<'primary' | 'secondary' | 'axis'>('primary');
  const [editorLabel, setEditorLabel] = useState('');
  const [editorCurrentBinding, setEditorCurrentBinding] = useState('');

  // Gamepad hook for input monitoring and highlighting
  const { devices, inputStatesRef, activeButtons } = useGamepad({
    onButtonPress: useCallback((input: { device: string; eliteKey: string }) => {
      // Set highlight on the device map
      setHighlightedKey({ device: input.device, key: input.eliteKey });
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedKey(null);
      }, 1500);
    }, []),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [bindingsRes, conflictsRes, unboundRes] = await Promise.all([
        fetch('/api/bindings'),
        fetch('/api/bindings/conflicts'),
        fetch('/api/bindings/unbound'),
      ]);

      if (!bindingsRes.ok) throw new Error(`Server returned ${bindingsRes.status}`);

      const bindingsJson = await bindingsRes.json();
      if (!bindingsJson.success) throw new Error(bindingsJson.error || 'Unknown error');
      setData(bindingsJson.data);

      if (conflictsRes.ok) {
        const conflictsJson = await conflictsRes.json();
        if (conflictsJson.success) setConflicts(conflictsJson.data.conflicts);
      }

      if (unboundRes.ok) {
        const unboundJson = await unboundRes.json();
        if (unboundJson.success) setUnboundActions(unboundJson.data.actions);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bindings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket for live binding updates
  const { subscribe } = useWebSocket();
  useEffect(() => {
    return subscribe('bindings:updated', () => {
      fetchData();
    });
  }, [subscribe, fetchData]);

  // Cleanup highlight timeout
  useEffect(() => {
    return () => clearTimeout(highlightTimeoutRef.current);
  }, []);

  // -----------------------------------------------------------------------
  // Helper: look up what action is bound to a device+key combo
  // -----------------------------------------------------------------------

  const findAction = useCallback(
    (device: string, key: string): string => {
      if (!data) return '--';
      const dLower = device.toLowerCase();
      const kLower = key.toLowerCase();

      for (const entry of Object.values(data.bindings)) {
        if (
          entry.primary &&
          entry.primary.device.toLowerCase() === dLower &&
          entry.primary.key.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
        if (
          entry.secondary &&
          entry.secondary.device.toLowerCase() === dLower &&
          entry.secondary.key.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
        if (
          entry.axis &&
          entry.axis.device.toLowerCase() === dLower &&
          entry.axis.axis.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
      }
      return '--';
    },
    [data],
  );

  /**
   * Raw find: returns the formatted action name string or null.
   * Used by BindingEditor for conflict detection.
   */
  const findActionRaw = useCallback(
    (device: string, key: string): string | null => {
      if (!data) return null;
      const dLower = device.toLowerCase();
      const kLower = key.toLowerCase();

      for (const entry of Object.values(data.bindings)) {
        if (
          entry.primary &&
          entry.primary.device.toLowerCase() === dLower &&
          entry.primary.key.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
        if (
          entry.secondary &&
          entry.secondary.device.toLowerCase() === dLower &&
          entry.secondary.key.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
        if (
          entry.axis &&
          entry.axis.device.toLowerCase() === dLower &&
          entry.axis.axis.toLowerCase() === kLower
        ) {
          return formatAction(entry.action);
        }
      }
      return null;
    },
    [data],
  );

  // -----------------------------------------------------------------------
  // Filtered bindings (by search and device)
  // -----------------------------------------------------------------------

  const filteredBindings = useMemo(() => {
    if (!data) return [];
    let entries = Object.values(data.bindings);

    // Filter by device
    if (selectedDevice) {
      const dLower = selectedDevice.toLowerCase();
      entries = entries.filter((e) => {
        const pMatch = e.primary?.device.toLowerCase() === dLower;
        const sMatch = e.secondary?.device.toLowerCase() === dLower;
        const aMatch = e.axis?.device.toLowerCase() === dLower;
        return pMatch || sMatch || aMatch;
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      entries = entries.filter((e) => e.action.toLowerCase().includes(qLower));
    }

    return entries;
  }, [data, selectedDevice, searchQuery]);

  // -----------------------------------------------------------------------
  // Binding editor handler
  // -----------------------------------------------------------------------

  const openEditor = useCallback(
    (action: string, slot: 'primary' | 'secondary' | 'axis', label: string, currentBinding: string) => {
      setEditorAction(action);
      setEditorSlot(slot);
      setEditorLabel(label);
      setEditorCurrentBinding(currentBinding);
      setEditorOpen(true);
    },
    [],
  );

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
  }, []);

  const onBindingSaved = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <div style={s.spinner} />
        <div style={s.loadingText}>Loading Bindings...</div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------

  if (error || !data) {
    return (
      <div style={s.errorContainer}>
        <div style={s.errorText}>
          {error || 'Failed to load bindings data'}
        </div>
        <button style={s.retryBtn} onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Success state
  // -----------------------------------------------------------------------

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={s.title}>HOTAS Bindings</h1>
            <div style={s.subtitle}>
              {data.name} v{data.majorVersion}.{data.minorVersion} -- {data.totalBindings} actions ({data.boundActions} bound, {data.unboundActions} unbound)
            </div>
          </div>
          <button
            style={{
              padding: '8px 18px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              border: '1px solid var(--color-accent-bright)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent-dim)',
              color: 'var(--color-accent-bright)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              marginTop: 4,
            }}
            onClick={() => setWizardOpen(true)}
          >
            Begin Binding Setup
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={s.searchContainer}>
        <input
          type="text"
          placeholder="Search bindings by action name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={s.searchInput}
        />
        {searchQuery && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
            {filteredBindings.length} result{filteredBindings.length !== 1 ? 's' : ''}
          </span>
        )}
        {selectedDevice && (
          <button
            style={s.retryBtn}
            onClick={() => setSelectedDevice(null)}
          >
            Clear Device Filter
          </button>
        )}
      </div>

      {/* Input Monitor */}
      <InputMonitor
        devices={devices}
        activeButtons={activeButtons}
        inputStatesRef={inputStatesRef}
        findAction={findAction}
        discoveryMode={discoveryMode}
        onToggleDiscovery={() => setDiscoveryMode((prev) => !prev)}
      />

      {/* Device overview */}
      <DeviceOverview
        devices={data.devices}
        bindings={data.bindings}
        selectedDevice={selectedDevice}
        onSelectDevice={setSelectedDevice}
      />

      {/* Visual device maps */}
      <div style={s.sectionHeader}>Device Maps</div>
      <div style={s.deviceMapContainer}>
        <WarthogThrottleMap
          bindings={data.bindings}
          findAction={findAction}
          highlightedKey={highlightedKey}
          onClickItem={openEditor}
        />
        <VkbStickMap
          bindings={data.bindings}
          findAction={findAction}
          highlightedKey={highlightedKey}
          onClickItem={openEditor}
        />
      </div>

      {/* Search results table (when searching or device-filtered) */}
      {(searchQuery || selectedDevice) && (
        <div style={{ ...s.panel, marginBottom: 'var(--space-lg)' }}>
          <div style={s.panelHeader}>
            {searchQuery ? `Search Results for "${searchQuery}"` : `Bindings for ${selectedDevice}`}
            {selectedDevice && searchQuery ? ` on ${selectedDevice}` : ''}
          </div>
          <BindingsTable entries={filteredBindings} searchQuery={searchQuery} onClickBinding={openEditor} />
        </div>
      )}

      {/* Category browser */}
      <CategoryBrowser
        categories={data.categories}
        bindings={data.bindings}
        searchQuery={searchQuery}
        onClickBinding={openEditor}
      />

      {/* Conflicts and Unbound side by side */}
      <div style={s.twoCol}>
        <ConflictsPanel conflicts={conflicts} />
        <UnboundPanel actions={unboundActions} />
      </div>

      {/* Binding Editor Modal */}
      {editorOpen && (
        <BindingEditor
          action={editorAction}
          slot={editorSlot}
          actionLabel={editorLabel}
          currentBinding={editorCurrentBinding}
          findActionRaw={findActionRaw}
          onClose={closeEditor}
          onSaved={onBindingSaved}
        />
      )}

      {/* Binding Setup Wizard */}
      {wizardOpen && (
        <BindingWizard
          onClose={() => setWizardOpen(false)}
          onComplete={() => { setWizardOpen(false); fetchData(); }}
          findActionRaw={findActionRaw}
        />
      )}
    </div>
  );
}
