import React, { useState } from 'react';
import { 
  Archive, 
  Trash2, 
  Download, 
  RotateCcw, 
  Plus, 
  RefreshCw,
  Clock,
  HardDrive
} from 'lucide-react';

interface BackupItem {
  filename: string;
  size: number; // Bytes
  createdAt: string;
}

interface BackupsProps {
  backups: BackupItem[];
  onCreateBackup: () => void;
  onRestoreBackup: (filename: string) => void;
  onDeleteBackup: (filename: string) => void;
  loading: boolean;
}

export default function Backups({ 
  backups, 
  onCreateBackup, 
  onRestoreBackup, 
  onDeleteBackup,
  loading 
}: BackupsProps) {
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Database & Config Backups</h1>
          <p className="text-sm text-zinc-400 mt-1">Generate, download, and restore backups of your configurations</p>
        </div>
        <button
          onClick={onCreateBackup}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Create Backup
        </button>
      </div>

      {/* Backup Warnings */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-400">Important Restore Notice</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Restoring a backup will overwrite your current settings, application listings, and server threshold configurations. On Android devices, database restoration will restart system services automatically. Please download critical backups locally.
          </p>
        </div>
      </div>

      {/* Backup list */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/40">
        <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/20 flex justify-between items-center">
          <span className="text-sm font-bold text-zinc-300">Backup Archives</span>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <HardDrive className="h-4 w-4" />
            <span>Stored in: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400 font-mono">.data/backups/</code></span>
          </div>
        </div>

        {loading && backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Managing archives...</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-850">
            {backups.map(item => {
              const isRestoring = confirmRestore === item.filename;

              return (
                <div key={item.filename} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-900/10 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                      <Archive className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 font-mono break-all">{item.filename}</h4>
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mt-1">
                        <span>Size: <strong className="text-zinc-400">{formatSize(item.size)}</strong></span>
                        <span>Created: <strong className="text-zinc-400">{formatDate(item.createdAt)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isRestoring ? (
                      <div className="flex items-center gap-1.5 bg-amber-950/20 border border-amber-500/30 p-1.5 rounded-xl">
                        <span className="text-xxs font-bold text-amber-400 px-2">Restore?</span>
                        <button
                          onClick={() => {
                            onRestoreBackup(item.filename);
                            setConfirmRestore(null);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmRestore(null)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-lg cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmRestore(item.filename)}
                          title="Restore Settings"
                          className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700/30 transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>

                        <a
                          href={`/api/backups/download/${item.filename}`}
                          download
                          title="Download ZIP/JSON"
                          className="flex items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700/30 transition-all cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </a>

                        <button
                          onClick={() => onDeleteBackup(item.filename)}
                          title="Delete Archive"
                          className="flex items-center justify-center p-2 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {backups.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No backup files found. Generate one above to keep a snapshot of the server dashboard.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
