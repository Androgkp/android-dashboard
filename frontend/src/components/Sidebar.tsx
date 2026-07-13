import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Terminal, 
  Archive, 
  GitPullRequest, 
  Settings as SettingsIcon,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apps', label: 'Applications', icon: Boxes },
    { id: 'pm2', label: 'PM2 Manager', icon: Terminal },
    { id: 'backups', label: 'Backups', icon: Archive },
    { id: 'deployments', label: 'Deployments', icon: GitPullRequest },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
        <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl">
          <Server className="h-6 w-6" />
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-wide text-white font-display block uppercase">AndrogKP</span>
          <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider">v1.0.0 • ANDROID</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-900 text-center">
        <span className="text-[10px] font-semibold text-zinc-600 font-mono">
          © 2026 androgkp.in
        </span>
      </div>
    </div>
  );
}
