import { dbService } from './dbService';
import { SystemMetrics } from './systemService';
import { Server } from 'socket.io';

// Tracking last notified timestamps to enforce a 5-minute cooldown
const cooldowns: Record<string, number> = {
  cpu: 0,
  ram: 0,
  temp: 0,
  battery: 0
};

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export class NotificationService {
  private static ioInstance?: Server;

  static init(io: Server) {
    this.ioInstance = io;
  }

  static async checkMetrics(metrics: SystemMetrics) {
    const settings = dbService.getSettings();
    const now = Date.now();

    // 1. CPU Alert
    if (metrics.cpuUsage >= settings.cpuThreshold) {
      if (now - cooldowns.cpu > COOLDOWN_MS) {
        await this.sendAlert('cpu', `⚠️ High CPU Usage: ${metrics.cpuUsage}% (Threshold: ${settings.cpuThreshold}%)`);
        cooldowns.cpu = now;
      }
    }

    // 2. RAM Alert
    const ramUsagePercent = (metrics.memoryUsed / metrics.memoryTotal) * 100;
    if (ramUsagePercent >= settings.ramThreshold) {
      if (now - cooldowns.ram > COOLDOWN_MS) {
        await this.sendAlert('ram', `⚠️ High RAM Usage: ${ramUsagePercent.toFixed(1)}% (Threshold: ${settings.ramThreshold}%)`);
        cooldowns.ram = now;
      }
    }

    // 3. Temp Alert
    if (metrics.temperature >= settings.tempThreshold) {
      if (now - cooldowns.temp > COOLDOWN_MS) {
        await this.sendAlert('temp', `🔥 Critical Temperature: ${metrics.temperature}°C (Threshold: ${settings.tempThreshold}°C)`);
        cooldowns.temp = now;
      }
    }

    // 4. Battery Low Alert
    if (metrics.batteryLevel <= settings.batteryThreshold && !metrics.batteryCharging) {
      if (now - cooldowns.battery > COOLDOWN_MS) {
        await this.sendAlert('battery', `🔋 Low Battery: ${metrics.batteryLevel}% (Threshold: ${settings.batteryThreshold}%)`);
        cooldowns.battery = now;
      }
    }
  }

  static async sendAlert(type: string, message: string) {
    const settings = dbService.getSettings();
    console.log(`[ALERT] [${type.toUpperCase()}] ${message}`);

    // A. Push real-time alert via WebSocket to browsers
    if (this.ioInstance) {
      this.ioInstance.emit('system_alert', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }

    // B. Discord Webhook
    if (settings.discordWebhook) {
      try {
        await fetch(settings.discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 **ServerOps Console Alert** 🚨\n${message}`
          })
        });
      } catch (err: any) {
        console.error('Failed to send Discord alert:', err.message);
      }
    }

    // C. Telegram Bot Alert
    if (settings.telegramToken && settings.telegramChatId) {
      try {
        const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: `🚨 ServerOps Console Alert 🚨\n\n${message}`
          })
        });
      } catch (err: any) {
        console.error('Failed to send Telegram alert:', err.message);
      }
    }
  }
}

