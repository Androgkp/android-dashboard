import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/api';

export const app = express();

app.use(cors());
app.use(express.json());

// Mount the API Router
app.use('/api', apiRouter);

// Serve frontend static assets in production mode
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving static frontend assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  
  // Catch-all to serve index.html for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <body style="font-family: sans-serif; background: #09090b; color: #e4e4e7; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; border: 1px solid #27272a; padding: 2.5rem; border-radius: 12px; background: #18181b; max-width: 480px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
          <h2 style="color: #3b82f6; margin-top: 0;">🚀 ServerOps Console API</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">The API server is running successfully. However, the production frontend build was not found at:</p>
          <code style="background: #09090b; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; display: block; border: 1px solid #27272a; overflow-x: auto; color: #f43f5e; margin: 1rem 0;">frontend/dist/</code>
          <p style="color: #a1a1aa; line-height: 1.6;">During development, start the frontend server separately: <code style="color: #3b82f6;">npm run dev:frontend</code>. For production deployment, build the frontend first: <code style="color: #10b981;">npm run build:frontend</code>.</p>
        </div>
      </body>
    `);
  });
}
