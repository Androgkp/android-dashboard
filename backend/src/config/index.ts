import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  ENV: process.env.NODE_ENV || 'development',
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '../../../.data'),
  JWT_SECRET: process.env.JWT_SECRET || 'serverops_super_secret_key_123',
  MOCK_PM2: process.env.MOCK_PM2 === 'true' || process.platform === 'win32', // Auto-mock PM2 on Windows
  MOCK_SYSTEM: process.env.MOCK_SYSTEM === 'true' || process.platform === 'win32' // Auto-mock Linux sysfs on Windows
};
