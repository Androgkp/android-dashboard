import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { CONFIG } from './config';
import { SystemService } from './services/systemService';
import { NotificationService } from './services/notificationService';

const server = http.createServer(app);

// Initialize Socket.IO with CORS configured for Vite dev server access
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Notification Service with Socket.IO instance for active toast streams
NotificationService.init(io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send immediate initial metrics packet to avoid 2-second delay
  SystemService.getMetrics()
    .then(metrics => socket.emit('metrics', metrics))
    .catch(err => console.error('Failed to send initial metrics:', err));

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Persistent background monitoring daemon (independent of browser connections)
const STARTUP_DELAY = 1000;
setTimeout(() => {
  console.log('Starting background telemetry polling...');
  setInterval(async () => {
    try {
      const metrics = await SystemService.getMetrics();
      
      // Stream real-time data to all connected browsers
      io.emit('metrics', metrics);
      
      // Check threshold violations for Telegram/Discord notifications
      await NotificationService.checkMetrics(metrics);
    } catch (err) {
      console.error('Error in background telemetry loop:', err);
    }
  }, 2000);
}, STARTUP_DELAY);

// Start Server
server.listen(CONFIG.PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 ServerOps Console running on http://localhost:${CONFIG.PORT}`);
  console.log(`🔧 Environment: ${CONFIG.ENV}`);
  console.log(`📦 Mocking PM2: ${CONFIG.MOCK_PM2}`);
  console.log(`💻 Mocking System Metrics: ${CONFIG.MOCK_SYSTEM}`);
  console.log(`===================================================`);
});
