import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Terminal, 
  Activity, 
  PlusCircle, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Pm2Process {
  id: number;
  pid: number;
  name: string;
  status: 'online' | 'stopped' | 'errored' | 'unknown';
  cpu: number;
  memory: number; // Bytes
  uptime: number; // Seconds
  outLogPath: string;
  errLogPath: string;
}

interface PM2Props {
  processes: Pm2Process[];
  onRestart: (nameOrId: string | number) => void;
  onStop: (nameOrId: string | number) => void;
  onDelete: (nameOrId: string | number) => void;
  onStartProcess: (scriptPath: string, name: string) => void;
  activeLogProcName: string | null;
  setActiveLogProcName: (name: string | null) => void;
}

export default function PM2({ 
  processes, 
  onRestart, 
  onStop, 
  onDelete, 
  onStartProcess,
  activeLogProcName,
  setActiveLogProcName
}: PM2Props) {
  const [showStartForm, setShowStartForm] = useState(false);
  const [scriptPath, setScriptPath] = useState('');
  const [newName, setNewName] = useState('');
  
  const [logType, setLogType] = useState<'out' | 'error'>('out');
  const [logLines, setLogLines] = useState(100);
  const [logContent, setLogContent] = useState('Select a process to view logs.');
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch logs when activeLogProcName changes
  const fetchLogs = async () => {
    if (!activeLogProcName) return;
    setLoadingLogs(true);
    try {
      const typeQuery = logType === 'error' ? '?type=error' : '?type=out';
      const linesQuery = `&lines=${logLines}`;
      const res = await fetch(`/api/pm2/logs/${activeLogProcName}${typeQuery}${linesQuery}`);
      const data = await res.json();
      setLogContent(data.logs || 'No log data available.');
    } catch (err: any) {
      setLogContent(`Error fetching logs: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeLogProcName, logType, logLines]);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptPath || !newName) return;
    onStartProcess(scriptPath, newName);
    setScriptPath('');
    setNewName('');
    setShowStartForm(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">PM2 Process Manager</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor, restart, and inspect Node.js microservices</p>
        </div>
        <button
          onClick={() => setShowStartForm(!showStartForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Start New Process
        </button>
      </div>

      {/* Start Process Form */}
      {showStartForm && (
        <form onSubmit={handleStartSubmit} className="glass-panel p-5 rounded-2xl border-blue-500/20 max-w-xl space-y-4">
          <h3 className="font-semibold text-white">Run New Service Script</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">PROCESS NAME</label>
              <input
                type="text"
                placeholder="e.g. backend-worker"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">SCRIPT ENTRYPOINT PATH</label>
              <input
                type="text"
                placeholder="e.g. /home/ubuntu/apps/server.js"
                value={scriptPath}
                onChange={e => setScriptPath(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowStartForm(false)}
              className="px-4 py-2 text-xs font-bold text-zinc-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              Launch Script
            </button>
          </div>
        </form>
      )}

      {/* Table view for Desktop, grid/list view for mobile */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-950/45 border-b border-zinc-800 text-zinc-400 font-bold text-xs uppercase">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">PID</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-center">CPU</th>
                <th className="py-4 px-4 text-center">Memory</th>
                <th className="py-4 px-4">Uptime</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc, index) => {
                const isOnline = proc.status === 'online';
                const isStopped = proc.status === 'stopped';
                const isErrored = proc.status === 'errored';

                return (
                  <tr 
                    key={proc.name} 
                    className={`border-b border-zinc-800/60 hover:bg-zinc-900/10 transition-colors ${
                      activeLogProcName === proc.name ? 'bg-blue-950/5' : ''
                    }`}
                  >
                    <td className="py-4 px-5 font-mono text-xs text-zinc-500">{proc.id}</td>
                    <td className="py-4 px-4 font-bold text-zinc-200">{proc.name}</td>
                    <td className="py-4 px-4 font-mono text-xs text-zinc-400">{proc.pid || '-'}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isOnline 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : (isStopped ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500/10 text-red-400')
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : (isStopped ? 'bg-zinc-500' : 'bg-red-500')}`} />
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-display font-semibold text-center text-zinc-200">
                      {isOnline ? `${proc.cpu}%` : '-'}
                    </td>
                    <td className="py-4 px-4 font-display font-semibold text-center text-zinc-200">
                      {isOnline ? formatBytes(proc.memory) : '-'}
                    </td>
                    <td className="py-4 px-4 text-zinc-400 text-xs">{formatUptime(proc.uptime)}</td>
                    <td className="py-4 px-5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => isOnline ? onStop(proc.name) : onRestart(proc.name)}
                          title={isOnline ? 'Stop' : 'Start'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isOnline 
                              ? 'bg-zinc-800 hover:bg-zinc-700/80 text-orange-400' 
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
                          }`}
                        >
                          {isOnline ? <Square className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                        </button>
                        <button
                          onClick={() => onRestart(proc.name)}
                          disabled={!isOnline}
                          title="Restart"
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <RotateCw className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => setActiveLogProcName(activeLogProcName === proc.name ? null : proc.name)}
                          title="View Log Terminal"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            activeLogProcName === proc.name 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200'
                          }`}
                        >
                          <Terminal className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => onDelete(proc.name)}
                          title="Delete Process"
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {processes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No active processes registered. Click 'Start New Process' to host a script.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Console Drawer (shows when activeLogProcName is set) */}
      {activeLogProcName && (
        <div className="glass-panel p-5 rounded-2xl border-blue-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-5 w-5 text-blue-400" />
              <h3 className="font-bold text-white">Live Logs: <span className="text-blue-400 font-mono">{activeLogProcName}</span></h3>
            </div>
            
            {/* Terminal Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Log Stream Selector */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setLogType('out')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    logType === 'out' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Standard Output (STDOUT)
                </button>
                <button
                  onClick={() => setLogType('error')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    logType === 'error' ? 'bg-red-500/10 text-red-400' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Error Log (STDERR)
                </button>
              </div>

              {/* Line Limit */}
              <select
                value={logLines}
                onChange={e => setLogLines(parseInt(e.target.value, 10))}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value={50}>Last 50 lines</option>
                <option value={100}>Last 100 lines</option>
                <option value={200}>Last 200 lines</option>
                <option value={500}>Last 500 lines</option>
              </select>

              {/* Refresh button */}
              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700/30 transition-all cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>
          </div>

          {/* Terminal Console Screen */}
          <div className="bg-zinc-950 rounded-xl border border-zinc-800/80 p-4 font-mono text-xs overflow-y-auto max-h-[350px] shadow-inner text-zinc-300 whitespace-pre-wrap">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" /> Fetching stream log slices...
              </div>
            ) : (
              logContent || 'Log stream is empty.'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
