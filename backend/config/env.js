require('dotenv').config();

module.exports = {
  PORT: Number(process.env.PORT) || 5112,
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === '1',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5312',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
