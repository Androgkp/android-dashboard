import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  ShieldAlert, 
  Mail, 
  Palette, 
  Save, 
  RefreshCw, 
  Trash2, 
  Plus,
  Moon,
  Sun,
  GitPullRequest
} from 'lucide-react';

interface SystemSettings {
  theme: 'dark' | 'light';
  cpuThreshold: number;
  ramThreshold: number;
  tempThreshold: number;
  batteryThreshold: number;
  discordWebhook: string;
  telegramToken: string;
  telegramChatId: string;
  enableDeployments: boolean;
}

interface SettingsProps {
  settings: SystemSettings | null;
  onSaveSettings: (settings: Partial<SystemSettings>) => void;
  allowedEmails: string[];
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
}

export default function Settings({ 
  settings, 
  onSaveSettings,
  allowedEmails,
  onAddEmail,
  onRemoveEmail
}: SettingsProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [ramThreshold, setRamThreshold] = useState(90);
  const [tempThreshold, setTempThreshold] = useState(80);
  const [batteryThreshold, setBatteryThreshold] = useState(20);
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [enableDeployments, setEnableDeployments] = useState(false);

  const [newEmail, setNewEmail] = useState('');

  // Sync state with settings prop
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setCpuThreshold(settings.cpuThreshold);
      setRamThreshold(settings.ramThreshold);
      setTempThreshold(settings.tempThreshold);
      setBatteryThreshold(settings.batteryThreshold);
      setDiscordWebhook(settings.discordWebhook);
      setTelegramToken(settings.telegramToken);
      setTelegramChatId(settings.telegramChatId);
      setEnableDeployments(settings.enableDeployments);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      theme,
      cpuThreshold,
      ramThreshold,
      tempThreshold,
      batteryThreshold,
      discordWebhook,
      telegramToken,
      telegramChatId,
      enableDeployments
    });
  };

  const handleAddEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    onAddEmail(newEmail.trim());
    setNewEmail('');
  };

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Loading config panels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">System Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure telemetry thresholds, channels, and access policies</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thresholds Card */}
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-300">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> Alert Thresholds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span>CPU THRESHOLD</span>
                <span className="text-amber-400 font-bold">{cpuThreshold}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={cpuThreshold}
                onChange={e => setCpuThreshold(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span>RAM THRESHOLD</span>
                <span className="text-amber-400 font-bold">{ramThreshold}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={ramThreshold}
                onChange={e => setRamThreshold(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span>CPU TEMP THRESHOLD (°C)</span>
                <span className="text-amber-400 font-bold">{tempThreshold}°C</span>
              </label>
              <input
                type="range"
                min="30"
                max="105"
                value={tempThreshold}
                onChange={e => setTempThreshold(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span>BATTERY ALERT (UNDER %)</span>
                <span className="text-amber-400 font-bold">{batteryThreshold}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={batteryThreshold}
                onChange={e => setBatteryThreshold(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Channel Card */}
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-300">
            <Bell className="h-5 w-5 text-blue-400" /> Webhook Alerts
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">DISCORD WEBHOOK URL</label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={e => setDiscordWebhook(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">TELEGRAM BOT TOKEN</label>
                <input
                  type="password"
                  placeholder="Bot API Token"
                  value={telegramToken}
                  onChange={e => setTelegramToken(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">TELEGRAM CHAT ID</label>
                <input
                  type="text"
                  placeholder="Telegram User or Group ID"
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-300">
            <Palette className="h-5 w-5 text-purple-400" /> Interface Theme
          </h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold text-sm cursor-pointer transition-all ${
                theme === 'dark' 
                  ? 'bg-zinc-800 border-purple-500 text-white font-bold' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Moon className="h-4 w-4" /> Dark (Material Zinc)
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold text-sm cursor-pointer transition-all ${
                theme === 'light' 
                  ? 'bg-zinc-800 border-purple-500 text-white font-bold' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun className="h-4 w-4" /> Light (Material Clean)
            </button>
          </div>
        </div>

        {/* Feature Settings Card */}
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-300">
            <GitPullRequest className="h-5 w-5 text-blue-400" /> Feature Switches
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-200 font-semibold block text-sm">Git Deployments Manager</span>
              <span className="text-zinc-500 text-xs mt-0.5 block">Enable or disable the repository builds & hot-reload deployments panel</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={enableDeployments}
                onChange={e => setEnableDeployments(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          <Save className="h-4.5 w-4.5" /> Save Configuration
        </button>
      </form>

      {/* Cloudflare Access Rules Card */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800/40 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-300">
          <Mail className="h-5 w-5 text-emerald-400" /> Cloudflare Access Control
        </h3>
        
        {/* Email form */}
        <form onSubmit={handleAddEmailSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="e.g. co-admin@androgkp.in"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add User
          </button>
        </form>

        {/* Email list */}
        <div className="bg-zinc-950/45 rounded-xl border border-zinc-850 divide-y divide-zinc-900 overflow-hidden">
          {allowedEmails.map(email => (
            <div key={email} className="px-4 py-3 flex justify-between items-center text-sm">
              <span className="text-zinc-300 font-mono">{email}</span>
              {/* Avoid deleting default email unless more exist */}
              <button
                type="button"
                onClick={() => onRemoveEmail(email)}
                disabled={allowedEmails.length <= 1}
                className="p-1 bg-zinc-800 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {allowedEmails.length === 0 && (
            <div className="p-4 text-center text-zinc-500 text-xs">
              No emails allowed yet. Anyone passing Cloudflare Access will be let through.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
