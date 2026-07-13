import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Battery, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  Activity, 
  RefreshCw, 
  FolderSync, 
  Archive 
} from 'lucide-react';

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

interface DashboardProps {
  metrics: SystemMetrics | null;
  history: SystemMetrics[];
  onTriggerBackup: () => void;
  onFlushLogs: () => void;
}

export default function Dashboard({ metrics, history, onTriggerBackup, onFlushLogs }: DashboardProps) {
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-zinc-400 font-medium">Connecting to telemetry stream...</p>
      </div>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const ramPercent = Math.round((metrics.memoryUsed / metrics.memoryTotal) * 100);
  const diskPercent = Math.round((metrics.diskUsed / metrics.diskTotal) * 100);

  // Format uptime (seconds to hh:mm:ss or days)
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  // Format chart data
  const chartData = history.map((m, idx) => ({
    time: idx.toString(),
    CPU: m.cpuUsage,
    RAM: Math.round((m.memoryUsed / m.memoryTotal) * 100),
    Temp: m.temperature,
    Download: m.networkDownload,
    Upload: m.networkUpload
  }));

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">ServerOps Console</h1>
          <p className="text-sm text-zinc-400 mt-1">Host OS: <span className="text-blue-400 font-medium">{metrics.osInfo}</span></p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-800">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="text-zinc-400">Uptime:</span>
          <span className="text-zinc-200 font-semibold">{formatUptime(metrics.uptime)}</span>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-blue-500/30 group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="h-16 w-16 text-blue-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-400">CPU LOAD</span>
            <Cpu className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-display text-white">{metrics.cpuUsage}%</div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* RAM */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-purple-500/30 group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-16 w-16 text-purple-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-400">MEM USAGE</span>
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-display text-white">{ramPercent}%</div>
            <div className="text-xs text-zinc-500 mt-1">{formatBytes(metrics.memoryUsed)} / {formatBytes(metrics.memoryTotal)}</div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${ramPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-orange-500/30 group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Thermometer className="h-16 w-16 text-orange-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-400">CPU TEMP</span>
            <Thermometer className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-display text-white">{metrics.temperature}°C</div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, (metrics.temperature / 100) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Battery */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Battery className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-400">BATTERY</span>
            <Battery className={`h-5 w-5 ${metrics.batteryCharging ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-display text-white">{metrics.batteryLevel}%</div>
            <div className="text-xs text-zinc-500 mt-1">
              {metrics.batteryCharging ? 'Charging' : 'Discharging'} • Health: <span className={metrics.batteryHealth.toLowerCase() === 'good' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{metrics.batteryHealth}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${metrics.batteryCharging ? 'bg-emerald-400' : 'bg-emerald-500'}`} 
                style={{ width: `${metrics.batteryLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Network & Disk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network Rates */}
        <div className="glass-panel p-5 rounded-2xl md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-zinc-400">NETWORK RATE</span>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <ArrowDown className="h-3 w-3" /> Down
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <ArrowUp className="h-3 w-3" /> Up
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ArrowDown className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-white">{metrics.networkDownload} <span className="text-xs text-zinc-500 font-normal">KB/s</span></div>
                <div className="text-xs text-zinc-500">Download</div>
              </div>
            </div>
            <div className="bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <ArrowUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-white">{metrics.networkUpload} <span className="text-xs text-zinc-500 font-normal">KB/s</span></div>
                <div className="text-xs text-zinc-500">Upload</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disk space */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-zinc-400">DISK SPACE</span>
            <HardDrive className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-white">{diskPercent}% <span className="text-xs text-zinc-500 font-normal">Used</span></div>
            <div className="text-xs text-zinc-500 mt-1">{formatBytes(metrics.diskUsed)} used of {formatBytes(metrics.diskTotal)}</div>
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-yellow-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${diskPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU/RAM Chart */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" /> CPU & RAM Trends (%)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, color: '#fff' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="CPU" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="RAM" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network & Temp Chart */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" /> Network rates (KB/s)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis stroke="#4b5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, color: '#fff' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="Download" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDl)" />
                <Area type="monotone" dataKey="Upload" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-base font-bold font-display text-white mb-4">Quick Operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={onTriggerBackup}
            className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700/30 transition-all cursor-pointer"
          >
            <Archive className="h-4 w-4 text-blue-400" />
            Backup Database
          </button>
          
          <button 
            onClick={onFlushLogs}
            className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700/30 transition-all cursor-pointer"
          >
            <FolderSync className="h-4 w-4 text-emerald-400" />
            Clear PM2 Logs
          </button>
        </div>
      </div>
    </div>
  );
}
