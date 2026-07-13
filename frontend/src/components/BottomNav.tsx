import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Terminal, 
  Archive, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'apps', label: 'Apps', icon: Boxes },
    { id: 'pm2', label: 'PM2', icon: Terminal },
    { id: 'backups', label: 'Backups', icon: Archive },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-900 px-2 py-1.5 flex justify-around items-center select-none pb-safe">
      {navItems.map(item => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="h-5.5 w-5.5" />
            <span className={`text-[10px] font-bold ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
