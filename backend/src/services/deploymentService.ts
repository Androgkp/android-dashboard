import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Pm2Service } from './pm2Service';

export interface DeploymentLog {
  id: string;
  timestamp: string;
  status: 'success' | 'running' | 'failed';
  log: string;
}

const deployLogs: DeploymentLog[] = [];

export class DeploymentService {
  static getLogs(): DeploymentLog[] {
    return deployLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  static async triggerDeployment(appName: string, repoPath?: string): Promise<string> {
    const id = Math.random().toString(36).substring(7);
    const logItem: DeploymentLog = {
      id,
      timestamp: new Date().toISOString(),
      status: 'running',
      log: `Starting deployment for ${appName}...\n`
    };
    deployLogs.push(logItem);

    const updateLog = (chunk: string) => {
      logItem.log += chunk;
    };

    const runCmd = (cmd: string, cwd: string): Promise<boolean> => {
      return new Promise((resolve) => {
        updateLog(`$ Running: ${cmd}\n`);
        const proc = exec(cmd, { cwd });
        
        proc.stdout?.on('data', (data) => {
          updateLog(data.toString());
        });

        proc.stderr?.on('data', (data) => {
          updateLog(data.toString());
        });

        proc.on('close', (code) => {
          if (code === 0) {
            updateLog(`Command completed successfully.\n\n`);
            resolve(true);
          } else {
            updateLog(`Command failed with exit code ${code}.\n\n`);
            resolve(false);
          }
        });
      });
    };

    // Run in background asynchronously so it doesn't block the API
    (async () => {
      const targetCwd = repoPath || path.resolve(__dirname, '../../../'); // defaults to project root
      
      try {
        if (!fs.existsSync(targetCwd)) {
          updateLog(`Error: Target directory does not exist: ${targetCwd}\n`);
          logItem.status = 'failed';
          return;
        }

        // 1. Git pull
        const pullSuccess = await runCmd('git pull', targetCwd);
        if (!pullSuccess) {
          logItem.status = 'failed';
          return;
        }

        // 2. Resolve deployment/build command from package.json
        const pkgPath = path.join(targetCwd, 'package.json');
        let buildCmd = '';

        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (pkg.scripts) {
              const hasYarn = fs.existsSync(path.join(targetCwd, 'yarn.lock'));
              const hasPnpm = fs.existsSync(path.join(targetCwd, 'pnpm-lock.yaml'));
              const runner = hasYarn ? 'yarn' : (hasPnpm ? 'pnpm' : 'npm');

              // ponytail: read 'build' command from package.json
              if (pkg.scripts.build) {
                buildCmd = `${runner} run build`;
              }
            }
          } catch (err: any) {
            updateLog(`Warning: Failed to parse package.json: ${err.message}\n`);
          }
        }

        // 3. Build
        if (buildCmd) {
          const buildSuccess = await runCmd(buildCmd, targetCwd);
          if (!buildSuccess) {
            logItem.status = 'failed';
            return;
          }
        } else {
          updateLog(`No build or deploy script found in package.json. Skipping build step.\n\n`);
        }

        // 3. Restart PM2 process
        updateLog(`Triggering PM2 restart for ${appName}...\n`);
        const restartSuccess = await Pm2Service.restartProcess(appName);
        if (restartSuccess) {
          updateLog(`PM2 process restarted successfully!\n`);
          logItem.status = 'success';
        } else {
          updateLog(`Warning: Failed to restart PM2 process ${appName}, check PM2 state.\n`);
          logItem.status = 'success'; // Mark as success since pull/build finished
        }
      } catch (err: any) {
        updateLog(`Fatal Error: ${err.message}\n`);
        logItem.status = 'failed';
      }
    })();

    return id;
  }
}
