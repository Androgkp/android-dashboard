import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  Terminal, 
  Play, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';

interface DeploymentLog {
  id: string;
  timestamp: string;
  status: 'success' | 'running' | 'failed';
  log: string;
}

interface Pm2Process {
  id: number;
  pid: number;
  name: string;
  status: 'online' | 'stopped' | 'errored' | 'unknown';
  cpu: number;
  memory: number;
  uptime: number;
}

interface DeploymentsProps {
  logs: DeploymentLog[];
  pm2Processes: Pm2Process[];
  onTriggerDeploy: (appName: string, repoPath?: string) => void;
  onRefreshLogs: () => void;
  loading: boolean;
}

export default function Deployments({ 
  logs, 
  pm2Processes,
  onTriggerDeploy, 
  onRefreshLogs,
  loading 
}: DeploymentsProps) {
  const [appName, setAppName] = useState('dashboard-api');
  const [repoPath, setRepoPath] = useState('');
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  // Auto-select the latest log ID if none selected
  useEffect(() => {
    if (logs.length > 0 && !activeLogId) {
      setActiveLogId(logs[0].id);
    }
  }, [logs]);

  const activeLog = logs.find(l => l.id === activeLogId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerDeploy(appName, repoPath || undefined);
    setRepoPath('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString() + ' - ' + new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Git Deployments Manager</h1>
          <p className="text-sm text-zinc-400 mt-1">Deploy, build, and hot-reload code repositories on the server</p>
        </div>
        <button
          onClick={onRefreshLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-800 text-zinc-200 text-sm font-semibold rounded-xl border border-zinc-700/30 transition-all cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger deployment panel */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" /> Trigger Deployment
            </h3>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">PM2 APPLICATION NAME</label>
              {/* ponytail: input list datalist resolves autocompletion without hardcoding */}
              <input
                type="text"
                list="pm2-deployments-list"
                placeholder="e.g. dashboard-api"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              <datalist id="pm2-deployments-list">
                {pm2Processes.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">REPOSITORY FOLDER PATH (OPTIONAL)</label>
              <input
                type="text"
                placeholder="Leave blank for project root"
                value={repoPath}
                onChange={e => setRepoPath(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xxs text-zinc-500 mt-1 leading-normal">
                If omitted, runs <code className="bg-zinc-900 px-1 py-0.5 rounded">git pull && npm run build</code> in the root folder of this dashboard project.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Play className="h-4 w-4" /> Start Build & Hot-Reload
            </button>
          </form>

          {/* Deployment History List */}
          <div className="glass-panel rounded-2xl border border-zinc-800/40 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/20 font-bold text-sm text-zinc-300">
              Deployment History
            </div>
            <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[300px]">
              {logs.map(log => {
                const isActive = activeLogId === log.id;
                const isSuccess = log.status === 'success';
                const isRunning = log.status === 'running';

                return (
                  <button
                    key={log.id}
                    onClick={() => setActiveLogId(log.id)}
                    className={`w-full text-left p-3.5 flex justify-between items-center transition-all cursor-pointer ${
                      isActive ? 'bg-zinc-800/60' : 'hover:bg-zinc-900/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                        {isRunning && <RefreshCw className="h-3 w-3 text-blue-400 animate-spin" />}
                        {isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {!isRunning && !isSuccess && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                        Build ID: {log.id}
                      </div>
                      <div className="text-xxs text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                    <span className={`text-xxs font-bold px-2 py-0.5 rounded ${
                      isRunning 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : (isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </button>
                );
              })}
              {logs.length === 0 && (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  No deployment history logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terminal logs panel */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-400" /> Build Terminal Output
              </h3>
              {activeLog && (
                <span className="text-xxs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
                  Build: {activeLog.id} ({activeLog.status})
                </span>
              )}
            </div>

            {/* Terminal console screen */}
            <div className="bg-zinc-950 rounded-xl border border-zinc-850 p-4 font-mono text-xs overflow-y-auto min-h-[300px] max-h-[500px] flex-1 shadow-inner text-zinc-300 whitespace-pre-wrap">
              {activeLog ? (
                activeLog.log
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
                  <FileText className="h-8 w-8 text-zinc-650" />
                  Select a deployment build from the history to view terminal compile logs.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
