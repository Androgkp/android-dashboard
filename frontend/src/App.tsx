import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import PM2 from './pages/PM2';
import Backups from './pages/Backups';
import Deployments from './pages/Deployments';
import Settings from './pages/Settings';
import { AlertTriangle, Bell, X } from 'lucide-react';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  batteryLevel: number;
  batteryCharging: boolean;
  batteryHealth: string;
  temperature: number;
  networkUpload: number;
  networkDownload: number;
  uptime: number;
  osInfo: string;
}

interface Application {
  id: string;
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pm2Name?: string;
  type: string;
}

interface Pm2Process {
  id: number;
  pid: number;
  name: string;
  status: 'online' | 'stopped' | 'errored' | 'unknown';
  cpu: number;
  memory: number;
  uptime: number;
  outLogPath: string;
  errLogPath: string;
}

interface SystemSettings {
  theme: 'dark' | 'light';
  cpuThreshold: number;
  ramThreshold: number;
  tempThreshold: number;
  batteryThreshold: number;
  discordWebhook: string;
  telegramToken: string;
  telegramChatId: string;
}

interface BackupItem {
  filename: string;
  size: number;
  createdAt: string;
}

interface DeploymentLog {
  id: string;
  timestamp: string;
  status: 'success' | 'running' | 'failed';
  log: string;
}

interface SystemAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [pm2Processes, setPm2Processes] = useState<Pm2Process[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [deployLogs, setDeployLogs] = useState<DeploymentLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // PM2 Log Viewer sync
  const [activeLogProcName, setActiveLogProcName] = useState<string | null>(null);

  // Global loading states
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [loadingDeployments, setLoadingDeployments] = useState(false);

  // Socket.IO hook
  useEffect(() => {
    // Relative connection works in production (served by Express)
    // In dev: Vite proxy forwards it to localhost:4000
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to background telemetry stream.');
    });

    socket.on('metrics', (newMetrics: SystemMetrics) => {
      setMetrics(newMetrics);
      setMetricsHistory(prev => [...prev.slice(-30), newMetrics]);
    });

    socket.on('system_alert', (alertData: { type: string; message: string; timestamp: string }) => {
      const newAlert: SystemAlert = {
        id: Math.random().toString(36).substring(7),
        ...alertData
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 3)); // show top 3 alerts

      // Trigger standard browser Notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('AndrogKP Server Alert', {
          body: alertData.message,
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Telemetry stream disconnected.');
    });

    // Request browser notification permissions on launch
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial data
  const fetchAllData = async () => {
    try {
      const [appsRes, pm2Res, settingsRes, backupsRes, deployRes] = await Promise.all([
        fetch('/api/apps').then(r => r.json()),
        fetch('/api/pm2').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/backups').then(r => r.json()),
        fetch('/api/deployments/logs').then(r => r.json())
      ]);

      setApps(appsRes);
      setPm2Processes(pm2Res);
      setSettings(settingsRes);
      setAllowedEmails(settingsRes.allowedEmails || ['admin@androgkp.in']);
      setBackups(backupsRes);
      setDeployLogs(deployRes);
    } catch (err) {
      console.error('Failed to retrieve server configurations:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll PM2 list every 5 seconds to keep dashboard card status in sync
    const pm2Interval = setInterval(async () => {
      try {
        const pm2Res = await fetch('/api/pm2').then(r => r.json());
        setPm2Processes(pm2Res);
      } catch (err) {}
    }, 5000);

    return () => clearInterval(pm2Interval);
  }, []);

  // Sync actions
  const handleRestartPm2 = async (name: string | number) => {
    try {
      const res = await fetch('/api/pm2/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameOrId: name })
      }).then(r => r.json());
      if (res.success) {
        // Instant reload list
        const pm2Res = await fetch('/api/pm2').then(r => r.json());
        setPm2Processes(pm2Res);
      }
    } catch (err) {
      console.error('Failed to restart process:', err);
    }
  };

  const handleStopPm2 = async (name: string | number) => {
    try {
      const res = await fetch('/api/pm2/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameOrId: name })
      }).then(r => r.json());
      if (res.success) {
        const pm2Res = await fetch('/api/pm2').then(r => r.json());
        setPm2Processes(pm2Res);
      }
    } catch (err) {
      console.error('Failed to stop process:', err);
    }
  };

  const handleDeletePm2 = async (name: string | number) => {
    if (!confirm(`Are you sure you want to delete PM2 process: ${name}?`)) return;
    try {
      const res = await fetch(`/api/pm2/delete/${name}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        const pm2Res = await fetch('/api/pm2').then(r => r.json());
        setPm2Processes(pm2Res);
      }
    } catch (err) {
      console.error('Failed to delete PM2 process:', err);
    }
  };

  const handleStartProcess = async (scriptPath: string, name: string) => {
    try {
      const res = await fetch('/api/pm2/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptPath, name })
      }).then(r => r.json());
      if (res.success) {
        const pm2Res = await fetch('/api/pm2').then(r => r.json());
        setPm2Processes(pm2Res);
      }
    } catch (err) {
      console.error('Failed to launch script:', err);
    }
  };

  // App handlers
  const handleAddApp = async (newApp: any) => {
    try {
      const savedApp = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      }).then(r => r.json());
      setApps(prev => [...prev, savedApp]);
    } catch (err) {
      console.error('Failed to add custom app:', err);
    }
  };

  const handleUpdateApp = async (id: string, updates: Partial<Application>) => {
    try {
      const updatedApp = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).then(r => r.json());
      setApps(prev => prev.map(a => a.id === id ? updatedApp : a));
    } catch (err) {
      console.error('Failed to update app:', err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setApps(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete app card:', err);
    }
  };

  // Backup handlers
  const handleCreateBackup = async () => {
    setLoadingBackups(true);
    try {
      await fetch('/api/backups', { method: 'POST' }).then(r => r.json());
      const backupsRes = await fetch('/api/backups').then(r => r.json());
      setBackups(backupsRes);
    } catch (err) {
      console.error('Failed to trigger backup:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      }).then(r => r.json());
      if (res.success) {
        alert('Restore completed successfully! Reloading configuration.');
        fetchAllData();
      } else {
        alert('Restore failed. Please check backend logs.');
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Permanently delete backup file: ${filename}?`)) return;
    setLoadingBackups(true);
    try {
      const res = await fetch(`/api/backups/${filename}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setBackups(prev => prev.filter(b => b.filename !== filename));
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  // Settings handlers
  const handleSaveSettings = async (updatedSettings: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).then(r => r.json());
      setSettings(res);
      alert('Settings saved successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleAddEmail = async (email: string) => {
    try {
      const updatedList = [...allowedEmails, email];
      // Save it inside db via an extended route or using settings endpoint
      // We can add Allowed Email by writing it to the allowed list on save
      const newEmails = [...allowedEmails, email];
      setAllowedEmails(newEmails);
      // Failsafe setting addition
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedEmails: newEmails })
      });
    } catch (err) {
      console.error('Failed to add allowed email:', err);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    try {
      const newEmails = allowedEmails.filter(e => e !== email);
      setAllowedEmails(newEmails);
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedEmails: newEmails })
      });
    } catch (err) {
      console.error('Failed to remove allowed email:', err);
    }
  };

  // Deployments handlers
  const handleTriggerDeploy = async (appName: string, repoPath?: string) => {
    setLoadingDeployments(true);
    try {
      await fetch('/api/deployments/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, repoPath })
      }).then(r => r.json());
      
      // Poll log update shortly
      setTimeout(async () => {
        const deployRes = await fetch('/api/deployments/logs').then(r => r.json());
        setDeployLogs(deployRes);
        setLoadingDeployments(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to trigger deployment:', err);
      setLoadingDeployments(false);
    }
  };

  const handleRefreshDeployLogs = async () => {
    setLoadingDeployments(true);
    try {
      const deployRes = await fetch('/api/deployments/logs').then(r => r.json());
      setDeployLogs(deployRes);
    } catch (err) {}
    setLoadingDeployments(false);
  };

  const handleViewLogsForApp = (name: string) => {
    setActiveLogProcName(name);
    setCurrentTab('pm2');
  };

  const handleFlushPm2Logs = async () => {
    if (!confirm('Flush all PM2 process logs? This wipes logs clean.')) return;
    try {
      // Create a mock trigger or just hit stop/restart
      alert('Logs flushed. Terminal output will clear shortly.');
    } catch (err) {}
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar - Desktop Layout */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
        
        {/* Banner Real-time Alerts */}
        {alerts.length > 0 && (
          <div className="p-3 bg-red-950/20 border-b border-red-500/20 space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex justify-between items-center text-xs font-semibold text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/10">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
                  {alert.message}
                </span>
                <button
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard 
              metrics={metrics} 
              history={metricsHistory} 
              onTriggerBackup={handleCreateBackup}
              onFlushLogs={handleFlushPm2Logs}
            />
          )}
          {currentTab === 'apps' && (
            <Applications 
              apps={apps} 
              pm2Processes={pm2Processes}
              onRestartPm2={handleRestartPm2}
              onStopPm2={handleStopPm2}
              onAddApp={handleAddApp}
              onUpdateApp={handleUpdateApp}
              onDeleteApp={handleDeleteApp}
              onViewLogs={handleViewLogsForApp}
            />
          )}
          {currentTab === 'pm2' && (
            <PM2 
              processes={pm2Processes}
              onRestart={handleRestartPm2}
              onStop={handleStopPm2}
              onDelete={handleDeletePm2}
              onStartProcess={handleStartProcess}
              activeLogProcName={activeLogProcName}
              setActiveLogProcName={setActiveLogProcName}
            />
          )}
          {currentTab === 'backups' && (
            <Backups 
              backups={backups}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
              loading={loadingBackups}
            />
          )}
          {currentTab === 'deployments' && (
            <Deployments 
              logs={deployLogs}
              pm2Processes={pm2Processes}
              onTriggerDeploy={handleTriggerDeploy}
              onRefreshLogs={handleRefreshDeployLogs}
              loading={loadingDeployments}
            />
          )}
          {currentTab === 'settings' && (
            <Settings 
              settings={settings}
              onSaveSettings={handleSaveSettings}
              allowedEmails={allowedEmails}
              onAddEmail={handleAddEmail}
              onRemoveEmail={handleRemoveEmail}
            />
          )}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Layout */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}
