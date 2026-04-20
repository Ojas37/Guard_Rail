import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Layers, 
  Key, 
  ScrollText, 
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Live Feed', path: '/live', icon: Activity },
  { name: 'Templates', path: '/templates', icon: Layers },
  { name: 'API Keys', path: '/keys', icon: Key },
  { name: 'Audit Logs', path: '/audit', icon: ScrollText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <aside
      className={cn(
        "flex flex-col bg-surface border-r border-border transition-all duration-300 z-20 h-screen",
        isCollapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      {/* Logo Area */}
      <div className="h-12 flex items-center px-3 border-b border-border shrink-0">
        <Shield className="w-5 h-5 text-primary-brand shrink-0" />
        {!isCollapsed && (
          <span className="ml-2 font-medium tracking-tight text-white line-clamp-1">
            SecureLLM
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center h-9 px-2 rounded-md transition-colors text-muted hover:text-white hover:bg-white/5",
                  isActive && "bg-primary-brand/10 text-primary-brand hover:bg-primary-brand/20 hover:text-primary-brand"
                )
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium leading-none">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-3 border-t border-border flex flex-col gap-3 shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full h-8 rounded-md text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        
        {!isCollapsed && (
          <div className="flex flex-col gap-1 text-[10px] text-muted uppercase font-mono tracking-wider pt-2">
            <div className="flex items-center justify-between">
              <span>Environment</span>
              <span className="text-success border border-success/20 bg-success/10 px-1.5 rounded-sm">PROD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Version</span>
              <span>v1.2.4</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
