import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { CONFIG } from '../config';

const BACKUP_DIR = path.join(CONFIG.DATA_DIR, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupItem {
  filename: string;
  size: number; // Bytes
  createdAt: string;
}

export class BackupService {
  static async listBackups(): Promise<BackupItem[]> {
    try {
      if (!fs.existsSync(BACKUP_DIR)) return [];
      const files = fs.readdirSync(BACKUP_DIR);
      return files
        .filter(f => f.endsWith('.tar.gz') || f.endsWith('.json'))
        .map(f => {
          const stat = fs.statSync(path.join(BACKUP_DIR, f));
          return {
            filename: f,
            size: stat.size,
            createdAt: stat.mtime.toISOString()
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err) {
      console.error('Error listing backups:', err);
      return [];
    }
  }

  static async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}`;
    const dbPath = path.join(CONFIG.DATA_DIR, 'db.json');

    if (process.platform === 'win32') {
      // Windows backup: simple JSON copy of database file
      const backupPath = path.join(BACKUP_DIR, `${filename}.json`);
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        return `${filename}.json`;
      }
      // If db file doesn't exist yet, save empty json
      fs.writeFileSync(backupPath, '{}', 'utf-8');
      return `${filename}.json`;
    } else {
      // Linux/UserLAnd: create a compressed tar.gz of .data folder contents (excluding backups themselves)
      const archiveName = `${filename}.tar.gz`;
      const archivePath = path.join(BACKUP_DIR, archiveName);
      
      return new Promise((resolve, reject) => {
        // Run tar command to compress everything in .data except 'backups' directory
        const cmd = `tar -czf "${archivePath}" -C "${CONFIG.DATA_DIR}" --exclude="backups" .`;
        exec(cmd, (error) => {
          if (error) {
            console.error('Tar compression backup failed:', error);
            reject(error);
          } else {
            resolve(archiveName);
          }
        });
      });
    }
  }

  static async deleteBackup(filename: string): Promise<boolean> {
    const filePath = path.join(BACKUP_DIR, filename);
    // Security check: ensure file path stays within backup directory
    if (!filePath.startsWith(BACKUP_DIR)) {
      throw new Error('Access denied: path traversal attempt.');
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  static async restoreBackup(filename: string): Promise<boolean> {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!filePath.startsWith(BACKUP_DIR) || !fs.existsSync(filePath)) {
      return false;
    }

    const dbPath = path.join(CONFIG.DATA_DIR, 'db.json');

    if (filename.endsWith('.json')) {
      // Restore JSON backup
      fs.copyFileSync(filePath, dbPath);
      return true;
    } else if (filename.endsWith('.tar.gz') && process.platform !== 'win32') {
      // Restore tar.gz backup by extracting it back to CONFIG.DATA_DIR
      return new Promise((resolve, reject) => {
        const cmd = `tar -xzf "${filePath}" -C "${CONFIG.DATA_DIR}"`;
        exec(cmd, (error) => {
          if (error) {
            console.error('Tar restore failed:', error);
            reject(error);
          } else {
            resolve(true);
          }
        });
      });
    }
    return false;
  }

  static getBackupPath(filename: string): string {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!filePath.startsWith(BACKUP_DIR)) {
      throw new Error('Access denied');
    }
    return filePath;
  }
}
