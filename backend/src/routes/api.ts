import { Router, Request, Response } from 'express';
import { SystemService } from '../services/systemService';
import { Pm2Service } from '../services/pm2Service';
import { dbService } from '../services/dbService';
import { BackupService } from '../services/backupService';
import { DeploymentService } from '../services/deploymentService';

export const apiRouter = Router();

// Middleware to mock authentication or handle Cloudflare Access headers
const authMiddleware = (req: Request, res: Response, next: any) => {
  // If we have Cloudflare headers, enforce access checks
  const emailHeader = req.headers['cf-access-authenticated-user-email'];
  if (emailHeader) {
    const allowed = dbService.getAllowedEmails();
    if (!allowed.includes(emailHeader as string)) {
      return res.status(403).json({ error: 'Access denied: user not allowed.' });
    }
  }
  next();
};

apiRouter.use(authMiddleware);

// --- System Routes ---
apiRouter.get('/system', async (req, res) => {
  try {
    const metrics = await SystemService.getMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PM2 Routes ---
apiRouter.get('/pm2', async (req, res) => {
  try {
    const processes = await Pm2Service.listProcesses();
    res.json(processes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/pm2/logs/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const isError = req.query.type === 'error';
    const lines = req.query.lines ? parseInt(req.query.lines as string, 10) : 100;
    const logData = await Pm2Service.readLogs(name, lines, isError);
    res.json({ logs: logData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/pm2/restart', async (req, res) => {
  try {
    const { nameOrId } = req.body;
    if (!nameOrId && nameOrId !== 0) return res.status(400).json({ error: 'Missing nameOrId' });
    const success = await Pm2Service.restartProcess(nameOrId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/pm2/stop', async (req, res) => {
  try {
    const { nameOrId } = req.body;
    if (!nameOrId && nameOrId !== 0) return res.status(400).json({ error: 'Missing nameOrId' });
    const success = await Pm2Service.stopProcess(nameOrId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/pm2/start', async (req, res) => {
  try {
    const { scriptPath, name } = req.body;
    if (!scriptPath || !name) return res.status(400).json({ error: 'Missing scriptPath or name' });
    const success = await Pm2Service.startProcess(scriptPath, name);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/pm2/delete/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const success = await Pm2Service.deleteProcess(name);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Applications Config ---
apiRouter.get('/apps', (req, res) => {
  res.json(dbService.getApplications());
});

apiRouter.post('/apps', (req, res) => {
  try {
    const { name, url, pm2Name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Missing fields' });
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newApp = dbService.addApplication({ id, name, url: url || '', pm2Name, type });
    res.status(201).json(newApp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/apps/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updated = dbService.updateApplication(id, req.body);
    if (!updated) return res.status(404).json({ error: 'App not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/apps/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = dbService.deleteApplication(id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Backup Routes ---
apiRouter.get('/backups', async (req, res) => {
  const backups = await BackupService.listBackups();
  res.json(backups);
});

apiRouter.post('/backups', async (req, res) => {
  try {
    const filename = await BackupService.createBackup();
    res.status(201).json({ filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/backups/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Missing filename' });
    const success = await BackupService.restoreBackup(filename);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/backups/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const success = await BackupService.deleteBackup(filename);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/backups/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = BackupService.getBackupPath(filename);
    res.download(filePath);
  } catch (err: any) {
    res.status(404).json({ error: 'File not found or access denied.' });
  }
});

// --- Settings Routes ---
apiRouter.get('/settings', (req, res) => {
  res.json(dbService.getSettings());
});

apiRouter.post('/settings', (req, res) => {
  try {
    const updated = dbService.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Deployments Routes ---
apiRouter.get('/deployments/logs', (req, res) => {
  res.json(DeploymentService.getLogs());
});

apiRouter.post('/deployments/trigger', async (req, res) => {
  try {
    const { appName, repoPath } = req.body;
    if (!appName) return res.status(400).json({ error: 'Missing appName' });
    const logId = await DeploymentService.triggerDeployment(appName, repoPath);
    res.json({ logId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
