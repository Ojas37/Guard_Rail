import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Overview } from './pages/Overview';
import { LiveFeed } from './pages/LiveFeed';
import { Templates } from './pages/Templates';
import { ApiKeys } from './pages/ApiKeys';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="live" element={<LiveFeed />} />
          <Route path="templates" element={<Templates />} />
          <Route path="keys" element={<ApiKeys />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
