import si from 'systeminformation';
import fs from 'fs';
import { CONFIG } from '../config';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  batteryLevel: number;
  batteryCharging: boolean;
  temperature: number;
  networkUpload: number; // KB/s
  networkDownload: number; // KB/s
  uptime: number;
  osInfo: string;
}

// Global cached network stats to calculate speeds
let lastNetworkStats = { rx: 0, tx: 0, time: Date.now() };

// Helper to read Linux sysfs file safely
function readSysfsNumber(filePath: string, divisor = 1): number | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      const val = parseFloat(content);
      return isNaN(val) ? null : val / divisor;
    }
  } catch (err) {
    // Graceful fallback, don't crash
  }
  return null;
}

function readSysfsString(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }
  } catch (err) {}
  return null;
}

export class SystemService {
  private static mockCpu = 25;
  private static mockRam = 45;
  private static mockTemp = 42;
  private static mockBattery = 80;
  private static mockBatteryCharging = true;
  private static mockNetworkRx = 120;
  private static mockNetworkTx = 45;

  static async getMetrics(): Promise<SystemMetrics> {
    if (CONFIG.MOCK_SYSTEM) {
      // Mock generator for local Windows development
      // Introduce slight variations to make UI look active
      this.mockCpu = Math.max(5, Math.min(95, this.mockCpu + (Math.random() - 0.5) * 10));
      this.mockRam = Math.max(30, Math.min(85, this.mockRam + (Math.random() - 0.5) * 2));
      this.mockTemp = Math.max(35, Math.min(75, this.mockTemp + (Math.random() - 0.5) * 3));
      if (Math.random() > 0.95) this.mockBatteryCharging = !this.mockBatteryCharging;
      this.mockBattery = this.mockBatteryCharging 
        ? Math.min(100, this.mockBattery + 0.1) 
        : Math.max(5, this.mockBattery - 0.1);

      this.mockNetworkRx = Math.max(10, this.mockNetworkRx + (Math.random() - 0.5) * 50);
      this.mockNetworkTx = Math.max(5, this.mockNetworkTx + (Math.random() - 0.5) * 20);

      return {
        cpuUsage: Math.round(this.mockCpu),
        memoryUsed: Math.round((this.mockRam / 100) * 5.5 * 1024 * 1024 * 1024), // 5.5GB total
        memoryTotal: 5.5 * 1024 * 1024 * 1024,
        diskUsed: 32 * 1024 * 1024 * 1024,
        diskTotal: 128 * 1024 * 1024 * 1024,
        batteryLevel: Math.round(this.mockBattery),
        batteryCharging: this.mockBatteryCharging,
        temperature: Math.round(this.mockTemp),
        networkDownload: Math.round(this.mockNetworkRx),
        networkUpload: Math.round(this.mockNetworkTx),
        uptime: Math.round(process.uptime()),
        osInfo: 'Windows 11 (Development Mock)'
      };
    }

    try {
      const [cpu, mem, disk, timeInfo, os] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.time(),
        si.osInfo()
      ]);

      // Calculate Disk Space (use root mount point or largest storage block)
      const mainDisk = disk.find(d => d.mount === '/' || d.mount === '/data') || disk[0] || { used: 0, size: 0 };

      // Calculate Network Speeds
      let downloadRate = 0;
      let uploadRate = 0;
      try {
        const netStats = await si.networkStats();
        // Sum up speeds across active interfaces
        const activeNet = netStats.find(n => n.operstate === 'up') || netStats[0];
        if (activeNet) {
          const now = Date.now();
          const durationSec = (now - lastNetworkStats.time) / 1000;
          if (durationSec > 0 && lastNetworkStats.rx > 0) {
            downloadRate = Math.max(0, (activeNet.rx_bytes - lastNetworkStats.rx) / 1024 / durationSec);
            uploadRate = Math.max(0, (activeNet.tx_bytes - lastNetworkStats.tx) / 1024 / durationSec);
          }
          lastNetworkStats = { rx: activeNet.rx_bytes, tx: activeNet.tx_bytes, time: now };
        }
      } catch (err) {
        // network stats error
      }

      // Read Android SysFS Battery
      // UserLAnd Ubuntu can read some files under /sys if permission allows
      let batteryLevel = readSysfsNumber('/sys/class/power_supply/battery/capacity') ?? 100;
      const batteryStatusStr = readSysfsString('/sys/class/power_supply/battery/status') || 'Unknown';
      const batteryCharging = batteryStatusStr.toLowerCase() === 'charging' || batteryStatusStr.toLowerCase() === 'full';

      // Read Android SysFS Temperature
      // Typically zone0 or zone1. We will search for thermal zone temp
      let temperature = 35;
      const temp0 = readSysfsNumber('/sys/class/thermal/thermal_zone0/temp', 1000);
      const temp1 = readSysfsNumber('/sys/class/thermal/thermal_zone1/temp', 1000);
      if (temp0 !== null && temp0 > 0 && temp0 < 120) {
        temperature = temp0;
      } else if (temp1 !== null && temp1 > 0 && temp1 < 120) {
        temperature = temp1;
      } else {
        // Fallback to systeminformation CPU temperature if available
        const cpuTemp = await si.cpuTemperature();
        temperature = cpuTemp.main || 40;
      }

      return {
        cpuUsage: Math.round(cpu.currentLoad),
        memoryUsed: mem.active,
        memoryTotal: mem.total,
        diskUsed: mainDisk.used,
        diskTotal: mainDisk.size,
        batteryLevel,
        batteryCharging,
        temperature: Math.round(temperature),
        networkDownload: Math.round(downloadRate),
        networkUpload: Math.round(uploadRate),
        uptime: Math.round(timeInfo.uptime),
        osInfo: `${os.distro} ${os.release} (${os.arch})`
      };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      // Fail-safe default metrics
      return {
        cpuUsage: 0,
        memoryUsed: 0,
        memoryTotal: 1,
        diskUsed: 0,
        diskTotal: 1,
        batteryLevel: 0,
        batteryCharging: false,
        temperature: 0,
        networkDownload: 0,
        networkUpload: 0,
        uptime: 0,
        osInfo: 'Linux (Degraded Metrics)'
      };
    }
  }
}
