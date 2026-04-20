import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Headerbar } from './Headerbar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Headerbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 text-text-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
