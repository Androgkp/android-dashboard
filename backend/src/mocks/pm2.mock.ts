import { Pm2Process } from '../services/pm2Service';

// ponytail: all dev mock data lives here, never touches production code paths
const mockPm2Processes: Pm2Process[] = [
  { id: 0, pid: 1024, name: 'my-api',   status: 'online',  cpu: 1,   memory: 42  * 1024 * 1024, uptime: 3600, outLogPath: 'mock_api_out.log',  errLogPath: 'mock_api_err.log'  },
  { id: 1, pid: 1025, name: 'my-app',   status: 'online',  cpu: 2,   memory: 180 * 1024 * 1024, uptime: 3600, outLogPath: 'mock_app_out.log',  errLogPath: 'mock_app_err.log'  },
  { id: 2, pid: 1026, name: 'my-tunnel',status: 'online',  cpu: 0.5, memory: 28  * 1024 * 1024, uptime: 3600, outLogPath: 'mock_tun_out.log',  errLogPath: 'mock_tun_err.log'  },
  { id: 3, pid: 0,    name: 'my-worker',status: 'stopped', cpu: 0,   memory: 0,                 uptime: 0,    outLogPath: 'mock_wkr_out.log',  errLogPath: 'mock_wkr_err.log'  },
];

export default mockPm2Processes;
