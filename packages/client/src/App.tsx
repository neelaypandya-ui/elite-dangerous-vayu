import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';

import Dashboard from './pages/Dashboard';
import Briefing from './pages/Briefing';
import Bindings from './pages/Bindings';
import Trade from './pages/Trade';
import Engineering from './pages/Engineering';
import Missions from './pages/Missions';
import Navigation from './pages/Navigation';
import Graphics from './pages/Graphics';
import Audio from './pages/Audio';
import Alerts from './pages/Alerts';
import Preflight from './pages/Preflight';
import Powerplay from './pages/Powerplay';
import Ships from './pages/Ships';
import Community from './pages/Community';
import Galnet from './pages/Galnet';
import Analytics from './pages/Analytics';
import Screenshots from './pages/Screenshots';
import Carrier from './pages/Carrier';
import Mining from './pages/Mining';
import Pips from './pages/Pips';
import Threats from './pages/Threats';
import Odyssey from './pages/Odyssey';
import Outfitting from './pages/Outfitting';
import Trivia from './pages/Trivia';
import Logbook from './pages/Logbook';
import Archiver from './pages/Archiver';
import Music from './pages/Music';
import Covas from './pages/Covas';
import Chakra from './pages/Chakra';

function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/briefing" element={<Briefing />} />
        <Route path="/bindings" element={<Bindings />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/engineering" element={<Engineering />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/navigation" element={<Navigation />} />
        <Route path="/graphics" element={<Graphics />} />
        <Route path="/audio" element={<Audio />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/preflight" element={<Preflight />} />
        <Route path="/powerplay" element={<Powerplay />} />
        <Route path="/ships" element={<Ships />} />
        <Route path="/community" element={<Community />} />
        <Route path="/galnet" element={<Galnet />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/screenshots" element={<Screenshots />} />
        <Route path="/carrier" element={<Carrier />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/pips" element={<Pips />} />
        <Route path="/threats" element={<Threats />} />
        <Route path="/odyssey" element={<Odyssey />} />
        <Route path="/outfitting" element={<Outfitting />} />
        <Route path="/trivia" element={<Trivia />} />
        <Route path="/logbook" element={<Logbook />} />
        <Route path="/archiver" element={<Archiver />} />
        <Route path="/music" element={<Music />} />
        <Route path="/covas" element={<Covas />} />
        <Route path="/chakra" element={<Chakra />} />
      </Route>
    </Routes>
  );
}

export default App;
