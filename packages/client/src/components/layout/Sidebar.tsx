import { NavLink } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';

interface NavItem {
  path: string;
  label: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', section: 'Core' },
  { path: '/chakra', label: 'CHAKRA' },
  { path: '/briefing', label: 'Briefing' },
  { path: '/bindings', label: 'Bindings' },
  { path: '/covas', label: 'COVAS' },
  { path: '/navigation', label: 'Navigation', section: 'Flight' },
  { path: '/trade', label: 'Trade' },
  { path: '/missions', label: 'Missions' },
  { path: '/mining', label: 'Mining' },
  { path: '/pips', label: 'Power Dist' },
  { path: '/engineering', label: 'Engineering', section: 'Ship' },
  { path: '/ships', label: 'Fleet' },
  { path: '/outfitting', label: 'Outfitting' },
  { path: '/carrier', label: 'Carrier' },
  { path: '/threats', label: 'Threats', section: 'Intel' },
  { path: '/powerplay', label: 'Powerplay' },
  { path: '/galnet', label: 'GalNet' },
  { path: '/community', label: 'Community' },
  { path: '/odyssey', label: 'Odyssey', section: 'On Foot' },
  { path: '/screenshots', label: 'Screenshots', section: 'Tools' },
  { path: '/logbook', label: 'Logbook' },
  { path: '/trivia', label: 'Trivia' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/music', label: 'Music' },
  { path: '/graphics', label: 'Graphics', section: 'Config' },
  { path: '/audio', label: 'Audio' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/preflight', label: 'Preflight' },
  { path: '/archiver', label: 'Archiver' },
];

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <nav style={{
      width: collapsed ? 48 : 200,
      minWidth: collapsed ? 48 : 200,
      height: '100%',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s, min-width 0.2s',
    }}>
      <div style={{
        padding: collapsed ? '16px 8px' : '16px',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-display)',
        fontSize: collapsed ? 14 : 18,
        color: 'var(--color-accent-bright)',
        letterSpacing: 2,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        {collapsed ? 'V' : 'VAYU'}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_ITEMS.map((item, i) => (
          <div key={item.path}>
            {item.section && !collapsed && (
              <div style={{
                padding: '12px 16px 4px',
                fontSize: 10,
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-muted)',
                letterSpacing: 2,
                textTransform: 'uppercase',
                ...(i > 0 ? { borderTop: '1px solid var(--color-border)', marginTop: 4 } : {}),
              }}>
                {item.section}
              </div>
            )}
            <NavLink
              to={item.path}
              style={({ isActive }) => ({
                display: 'block',
                padding: collapsed ? '8px 0' : '6px 16px',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                color: isActive ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                borderLeft: isActive ? '2px solid var(--color-accent-bright)' : '2px solid transparent',
                background: isActive ? 'rgba(78, 154, 62, 0.1)' : 'transparent',
                textAlign: collapsed ? 'center' : 'left',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              })}
            >
              {collapsed ? item.label[0] : item.label}
            </NavLink>
          </div>
        ))}
      </div>
    </nav>
  );
}
