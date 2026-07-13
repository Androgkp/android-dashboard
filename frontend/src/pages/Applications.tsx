import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  ExternalLink, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  AlertCircle,
  Link as LinkIcon 
} from 'lucide-react';

interface Application {
  id: string;
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pm2Name?: string;
  cpu?: number;
  memory?: number;
  uptime?: number;
  type: 'n8n' | 'filebrowser' | 'beszel' | 'cloudflared' | 'custom';
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

interface ApplicationsProps {
  apps: Application[];
  pm2Processes: Pm2Process[];
  onRestartPm2: (name: string) => void;
  onStopPm2: (name: string) => void;
  onAddApp: (app: Omit<Application, 'id' | 'status'>) => void;
  onUpdateApp: (id: string, updates: Partial<Application>) => void;
  onDeleteApp: (id: string) => void;
  onViewLogs: (name: string) => void;
}

export default function Applications({ 
  apps, 
  pm2Processes, 
  onRestartPm2, 
  onStopPm2, 
  onAddApp, 
  onUpdateApp,
  onDeleteApp, 
  onViewLogs 
}: ApplicationsProps) {
  const [activeForm, setActiveForm] = useState<'add' | 'edit' | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [pm2Name, setPm2Name] = useState('');
  const [type, setType] = useState<'n8n' | 'filebrowser' | 'beszel' | 'cloudflared' | 'custom'>('custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeForm === 'add') {
      onAddApp({ name, url, pm2Name: pm2Name || undefined, type });
    } else if (activeForm === 'edit' && selectedAppId) {
      onUpdateApp(selectedAppId, { name, url, pm2Name: pm2Name || undefined, type });
    }

    setName('');
    setUrl('');
    setPm2Name('');
    setType('custom');
    setActiveForm(null);
    setSelectedAppId(null);
  };

  const handleEditClick = (app: Application) => {
    setSelectedAppId(app.id);
    setName(app.name);
    setUrl(app.url);
    setPm2Name(app.pm2Name || '');
    setType(app.type);
    setActiveForm('edit');
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(decimals) + ' MB';
  };

  // Cross-reference DB Application with live PM2 Process telemetry
  const getAppTelemetry = (app: Application) => {
    if (!app.pm2Name) return { status: 'unknown', cpu: 0, memory: 0, matched: false };
    const pm2Proc = pm2Processes.find(p => p.name === app.pm2Name);
    // ponytail: unknown when no match — could be wrong name, not yet loaded, or missing
    if (!pm2Proc) return { status: 'unknown', cpu: 0, memory: 0, matched: false };
    return {
      status: pm2Proc.status === 'online' ? 'running' : (pm2Proc.status === 'stopped' ? 'stopped' : 'error'),
      cpu: pm2Proc.cpu,
      memory: pm2Proc.memory,
      matched: true
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">System Applications</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and access services running on this server</p>
        </div>
        <button
          onClick={() => {
            if (activeForm === 'add') {
              setActiveForm(null);
            } else {
              setName('');
              setUrl('');
              setPm2Name('');
              setType('custom');
              setActiveForm('add');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Application
        </button>
      </div>

      {/* Form (Add or Edit) */}
      {activeForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-5 rounded-2xl border-blue-500/20 max-w-xl space-y-4">
          <h3 className="font-semibold text-white">
            {activeForm === 'add' ? 'Add New Service Card' : 'Edit Service Card'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">SERVICE NAME</label>
              <input
                type="text"
                placeholder="e.g. VS Code Server"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">SERVICE TYPE</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="custom">Custom Service</option>
                <option value="n8n">n8n Workflow</option>
                <option value="filebrowser">File Browser</option>
                <option value="beszel">Beszel Node</option>
                <option value="cloudflared">Cloudflare Tunnel</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ACCESS URL (OPTIONAL)</label>
              <input
                type="url"
                placeholder="https://service.androgkp.in"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">PM2 PROCESS NAME (FOR TELEMETRY BINDING)</label>
              {/* ponytail: dropdown of live PM2 processes to prevent typos causing sync issues */}
              <select
                value={pm2Name}
                onChange={e => setPm2Name(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">— No PM2 binding —</option>
                {pm2Processes.map(p => (
                  <option key={p.name} value={p.name}>{p.name} ({p.status})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveForm(null);
                setSelectedAppId(null);
              }}
              className="px-4 py-2 text-xs font-bold text-zinc-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              Save Service
            </button>
          </div>
        </form>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {apps.map(app => {
          const telemetry = getAppTelemetry(app);
          const isRunning = telemetry.status === 'running';
          const isStopped = telemetry.status === 'stopped';
          const isError = telemetry.status === 'error';

          return (
            <div 
              key={app.id}
              className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-zinc-700/60 ${
                isError ? 'border-red-500/20 hover:border-red-500/30' : ''
              }`}
            >
              <div>
                {/* Card Title & Icon */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-white font-display flex items-center gap-1.5">
                      {app.name}
                    </h3>
                    <span className="text-xxs uppercase tracking-wider bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 font-semibold">
                      {app.type}
                    </span>
                  </div>
                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isRunning 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : (isStopped ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-red-500/10 text-red-400 border border-red-500/20')
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : (isStopped ? 'bg-zinc-500' : 'bg-red-500')}`} />
                    {telemetry.status.toUpperCase()}
                  </span>
                </div>

                {/* Telemetry Stats */}
                {app.pm2Name && (
                  <div className="grid grid-cols-2 gap-3 mt-5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900/60 text-xs">
                    <div>
                      <span className="text-zinc-500 font-medium block">CPU Load</span>
                      <span className="text-zinc-200 font-bold font-display mt-0.5 block">
                        {isRunning ? `${telemetry.cpu}%` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium block">Memory</span>
                      <span className="text-zinc-200 font-bold font-display mt-0.5 block">
                        {isRunning ? formatBytes(telemetry.memory) : '-'}
                      </span>
                    </div>
                    {/* ponytail: show binding name so user can debug mismatches instantly */}
                    <div className="col-span-2 border-t border-zinc-800/60 pt-2">
                      <span className="text-zinc-600 font-medium block">PM2 Binding</span>
                      <span className={`font-mono mt-0.5 block truncate ${
                        telemetry.matched ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {app.pm2Name}{!telemetry.matched ? ' ⚠ no match' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Service Url Info */}
                {app.url && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                    <LinkIcon className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate">{app.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
              </div>

              {/* Actions Button Group */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/40">
                {app.pm2Name && (
                  <>
                    <button
                      onClick={() => isRunning ? onStopPm2(app.pm2Name!) : onRestartPm2(app.pm2Name!)}
                      title={isRunning ? 'Stop Process' : 'Start Process'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isRunning 
                          ? 'bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-850 text-orange-400' 
                          : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                      }`}
                    >
                      {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => onRestartPm2(app.pm2Name!)}
                      disabled={!isRunning}
                      title="Restart Process"
                      className="p-2 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-850 text-zinc-200 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onViewLogs(app.pm2Name!)}
                      title="View System Logs"
                      className="p-2 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-850 text-zinc-200 rounded-xl transition-all cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </>
                )}

                {app.url && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Open Service URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(app)}
                  title="Edit Application Details"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-850 text-zinc-200 rounded-xl transition-all cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* Delete button (only show for custom apps added by user) */}
                {app.id !== 'n8n' && app.id !== 'filebrowser' && app.id !== 'beszel' && app.id !== 'cloudflared' && app.id !== 'dashboard-api' && (
                  <button
                    onClick={() => onDeleteApp(app.id)}
                    title="Delete Application Card"
                    className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl transition-all ml-auto cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
