require('dotenv').config();

const useMemory = ['1', 'true', 'yes'].includes(String(process.env.USE_MEMORY_DB || '').toLowerCase().trim());

module.exports = {
  PORT: Number(process.env.PORT) || 5112,
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_MEMORY_DB: useMemory,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5312',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
