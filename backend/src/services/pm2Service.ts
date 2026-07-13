import { exec } from 'child_process';
import fs from 'fs';
import { CONFIG } from '../config';
import mockPm2ProcessesBase from '../mocks/pm2.mock';

export interface Pm2Process {
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

// ponytail: mutable copy so mock actions (stop/restart) work in-memory during dev
let mockPm2Processes = CONFIG.MOCK_PM2 ? [...mockPm2ProcessesBase] : [];

export class Pm2Service {
  private static cachedPm2Command: string | null = null;

  private static runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private static async getPm2Command(): Promise<string> {
    if (this.cachedPm2Command) return this.cachedPm2Command;

    if (CONFIG.MOCK_PM2) {
      this.cachedPm2Command = 'pm2';
      return 'pm2';
    }

    const pathsToTry = [
      'pm2',
      '/usr/bin/pm2',
      '/usr/local/bin/pm2',
      '/opt/node/bin/pm2',
      '~/.npm-global/bin/pm2',
      'npx pm2',
      'node_modules/.bin/pm2'
    ];

    for (const p of pathsToTry) {
      try {
        await new Promise<void>((resolve, reject) => {
          exec(`${p} -v`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        this.cachedPm2Command = p;
        console.log(`Found PM2 executable path: ${p}`);
        return p;
      } catch (err) {
        // try next path
      }
    }

    this.cachedPm2Command = 'pm2';
    return 'pm2';
  }

  static async listProcesses(): Promise<Pm2Process[]> {
    if (CONFIG.MOCK_PM2) {
      // Return mock processes with dynamic slight CPU/RAM deviations
      return mockPm2Processes.map(proc => {
        if (proc.status === 'online') {
          return {
            ...proc,
            cpu: Math.max(0, parseFloat((proc.cpu + (Math.random() - 0.5) * 0.5).toFixed(1))),
            memory: Math.round(Math.max(10 * 1024 * 1024, proc.memory + (Math.random() - 0.5) * 512 * 1024)),
            uptime: proc.uptime + 2
          };
        }
        return proc;
      });
    }

    try {
      const pm2Cmd = await this.getPm2Command();
      // pm2 jlist returns JSON details of running processes
      const stdout = await this.runCommand(`${pm2Cmd} jlist`);
      const rawList = JSON.parse(stdout);
      
      return rawList.map((proc: any) => ({
        id: proc.pm_id,
        pid: proc.pid || 0,
        name: proc.name,
        status: proc.pm2_env?.status === 'online' ? 'online' : (proc.pm2_env?.status === 'stopped' ? 'stopped' : 'errored'),
        cpu: proc.monit?.cpu || 0,
        memory: proc.monit?.memory || 0,
        uptime: proc.pm2_env?.pm_uptime ? Math.round((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0,
        outLogPath: proc.pm2_env?.pm_out_log_path || '',
        errLogPath: proc.pm2_env?.pm_err_log_path || ''
      }));
    } catch (error) {
      console.warn('Failed to call PM2 CLI, returning empty list:', error);
      return [];
    }
  }

  static async restartProcess(nameOrId: string | number): Promise<boolean> {
    if (CONFIG.MOCK_PM2) {
      const proc = mockPm2Processes.find(p => p.name === nameOrId.toString() || p.id === Number(nameOrId));
      if (proc) {
        proc.status = 'online';
        proc.pid = Math.floor(Math.random() * 5000) + 1000;
        proc.uptime = 0;
        proc.cpu = 1;
        proc.memory = 32 * 1024 * 1024;
        return true;
      }
      return false;
    }

    try {
      const pm2Cmd = await this.getPm2Command();
      await this.runCommand(`${pm2Cmd} restart ${nameOrId}`);
      return true;
    } catch (err) {
      console.error(`PM2 restart error for ${nameOrId}:`, err);
      return false;
    }
  }

  static async stopProcess(nameOrId: string | number): Promise<boolean> {
    if (CONFIG.MOCK_PM2) {
      const proc = mockPm2Processes.find(p => p.name === nameOrId.toString() || p.id === Number(nameOrId));
      if (proc) {
        proc.status = 'stopped';
        proc.pid = 0;
        proc.uptime = 0;
        proc.cpu = 0;
        proc.memory = 0;
        return true;
      }
      return false;
    }

    try {
      const pm2Cmd = await this.getPm2Command();
      await this.runCommand(`${pm2Cmd} stop ${nameOrId}`);
      return true;
    } catch (err) {
      console.error(`PM2 stop error for ${nameOrId}:`, err);
      return false;
    }
  }

  static async deleteProcess(nameOrId: string | number): Promise<boolean> {
    if (CONFIG.MOCK_PM2) {
      const initialLen = mockPm2Processes.length;
      mockPm2Processes = mockPm2Processes.filter(p => p.name !== nameOrId.toString() && p.id !== Number(nameOrId));
      return mockPm2Processes.length < initialLen;
    }

    try {
      const pm2Cmd = await this.getPm2Command();
      await this.runCommand(`${pm2Cmd} delete ${nameOrId}`);
      return true;
    } catch (err) {
      console.error(`PM2 delete error for ${nameOrId}:`, err);
      return false;
    }
  }

  static async startProcess(scriptPath: string, name: string): Promise<boolean> {
    if (CONFIG.MOCK_PM2) {
      if (mockPm2Processes.some(p => p.name === name)) return false;
      mockPm2Processes.push({
        id: mockPm2Processes.length,
        pid: Math.floor(Math.random() * 5000) + 1000,
        name,
        status: 'online',
        cpu: 0.5,
        memory: 24 * 1024 * 1024,
        uptime: 0,
        outLogPath: `mock_${name}_out.log`,
        errLogPath: `mock_${name}_err.log`
      });
      return true;
    }

    try {
      const pm2Cmd = await this.getPm2Command();
      await this.runCommand(`${pm2Cmd} start "${scriptPath}" --name "${name}"`);
      await this.runCommand(`${pm2Cmd} save`);
      return true;
    } catch (err) {
      console.error(`PM2 start error for ${name}:`, err);
      return false;
    }
  }

  static async readLogs(nameOrId: string | number, linesCount = 100, isError = false): Promise<string> {
    if (CONFIG.MOCK_PM2) {
      const type = isError ? 'ERROR' : 'INFO';
      const timestamp = new Date().toISOString();
      return Array.from({ length: 20 }, (_, idx) => 
        `[${timestamp}] [${type}] [mock-proc-${nameOrId}] Log message sequence line #${idx + 1} for simulation.`
      ).join('\n');
    }

    try {
      const processes = await this.listProcesses();
      const proc = processes.find(p => p.name === nameOrId.toString() || p.id === Number(nameOrId));
      if (!proc) return `Process "${nameOrId}" not found.`;

      const logPath = isError ? proc.errLogPath : proc.outLogPath;
      if (!logPath || !fs.existsSync(logPath)) {
        return `Log file not available or does not exist at: ${logPath}`;
      }

      // Read file and grab the last N lines efficiently
      const stat = fs.statSync(logPath);
      const bufferSize = Math.min(stat.size, 64 * 1024); // read last 64KB max
      const fd = fs.openSync(logPath, 'r');
      const buffer = Buffer.alloc(bufferSize);
      fs.readSync(fd, buffer, 0, bufferSize, stat.size - bufferSize);
      fs.closeSync(fd);

      const logs = buffer.toString('utf-8');
      const lines = logs.split('\n');
      return lines.slice(-linesCount).join('\n');
    } catch (err: any) {
      return `Error reading logs: ${err.message}`;
    }
  }
}
