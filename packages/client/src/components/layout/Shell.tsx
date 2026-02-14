import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ScanLineOverlay from '../common/ScanLineOverlay';

export default function Shell() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, position: 'relative' }}>
          <Outlet />
        </main>
      </div>
      <ScanLineOverlay />
    </div>
  );
}
