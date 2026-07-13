import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

// Ensure data directory exists
if (!fs.existsSync(CONFIG.DATA_DIR)) {
  fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(CONFIG.DATA_DIR, 'db.json');

export interface Application {
  id: string;
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pm2Name?: string;
  cpu?: number;
  memory?: number;
  uptime?: number;
  type: string;
}

export interface SystemSettings {
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

interface DatabaseSchema {
  settings: SystemSettings;
  applications: Application[];
  allowedEmails: string[];
  pushSubscriptions: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  settings: {
    theme: 'dark',
    cpuThreshold: 90,
    ramThreshold: 90,
    tempThreshold: 80,
    batteryThreshold: 20,
    discordWebhook: '',
    telegramToken: '',
    telegramChatId: '',
    enableDeployments: false
  },
  // ponytail: no hardcoded apps — user adds their own via the UI
  applications: [],
  allowedEmails: ['admin@serverops.local'],
  pushSubscriptions: []
};

class DbService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    // ponytail: simple robust file reading with fallback to default schema
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...DEFAULT_DB, ...JSON.parse(content) };
      }
    } catch (err) {
      console.error('Error reading database file, using defaults:', err);
    }
    this.saveData(DEFAULT_DB);
    return DEFAULT_DB;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  }

  getSettings(): SystemSettings {
    return this.data.settings;
  }

  updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData(this.data);
    return this.data.settings;
  }

  getApplications(): Application[] {
    return this.data.applications;
  }

  updateApplication(id: string, updates: Partial<Application>): Application | null {
    const appIndex = this.data.applications.findIndex(a => a.id === id);
    if (appIndex === -1) return null;
    this.data.applications[appIndex] = { ...this.data.applications[appIndex], ...updates };
    this.saveData(this.data);
    return this.data.applications[appIndex];
  }

  addApplication(app: Omit<Application, 'status'>): Application {
    const newApp: Application = { ...app, status: 'unknown' };
    this.data.applications.push(newApp);
    this.saveData(this.data);
    return newApp;
  }

  deleteApplication(id: string): boolean {
    const initialLen = this.data.applications.length;
    this.data.applications = this.data.applications.filter(a => a.id !== id);
    if (this.data.applications.length < initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  getAllowedEmails(): string[] {
    return this.data.allowedEmails;
  }

  addAllowedEmail(email: string) {
    if (!this.data.allowedEmails.includes(email)) {
      this.data.allowedEmails.push(email);
      this.saveData(this.data);
    }
  }

  removeAllowedEmail(email: string) {
    this.data.allowedEmails = this.data.allowedEmails.filter(e => e !== email);
    this.saveData(this.data);
  }

  getPushSubscriptions(): any[] {
    return this.data.pushSubscriptions || [];
  }

  addPushSubscription(sub: any) {
    if (!this.data.pushSubscriptions) {
      this.data.pushSubscriptions = [];
    }
    // Prevent duplicates by checking endpoint
    const exists = this.data.pushSubscriptions.find(s => s.endpoint === sub.endpoint);
    if (!exists) {
      this.data.pushSubscriptions.push(sub);
      this.saveData(this.data);
    }
  }

  removePushSubscription(endpoint: string) {
    if (this.data.pushSubscriptions) {
      this.data.pushSubscriptions = this.data.pushSubscriptions.filter(s => s.endpoint !== endpoint);
      this.saveData(this.data);
    }
  }
}

export const dbService = new DbService();
