import { Bell, Search, Hexagon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const routeNames: Record<string, string> = {
  '/overview': 'Overview',
  '/live': 'Live Feed',
  '/templates': 'Guardrail Templates',
  '/keys': 'API Keys Management',
  '/audit': 'Audit Logs',
  '/settings': 'Settings',
};

export function Headerbar() {
  const location = useLocation();
  const pageTitle = routeNames[location.pathname] || 'Dashboard';

  return (
    <header className="h-12 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 z-10 w-full">
      <div className="flex items-center">
        <h1 className="text-sm font-semibold text-white tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* API Key Selector Placeholder */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas border border-border text-xs">
          <Hexagon className="w-3.5 h-3.5 text-primary-brand" />
          <span className="text-muted">Key:</span>
          <span className="font-mono text-white">aegis_sk_****abcd</span>
        </div>

        {/* Search Placeholder */}
        <button className="text-muted hover:text-white transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="text-muted hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full border-[1.5px] border-surface"></span>
        </button>

        <div className="w-px h-4 bg-border mx-1"></div>

        {/* Avatar Placeholder */}
        <button className="flex items-center gap-2 focus:outline-none">
          <div className="w-7 h-7 rounded-sm bg-primary-brand/20 border border-primary-brand/30 flex items-center justify-center text-primary-brand text-xs font-semibold">
            JD
          </div>
        </button>
      </div>
    </header>
  );
}
