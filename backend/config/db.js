const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Ensure public DNS resolver is available if system only has loopback (common on Windows)
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.every((s) => s.startsWith('127.'))) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // Ignore DNS config errors
}

let memoryServer = null;

// Connects to MONGODB_URI, or spins an ephemeral in-memory MongoDB when
// USE_MEMORY_DB=1 (zero-config demo mode with auto-seeded demo data).
async function connectDB() {
  if (env.USE_MEMORY_DB) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    return { memory: true };
  }
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Configure it in backend/.env or set USE_MEMORY_DB=1 for demo mode.');
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (err) {
    // If TLS clock skew (CERT_NOT_YET_VALID) or SSL issue occurs, retry with tlsAllowInvalidCertificates
    if (err.message && (err.message.includes('CERT_NOT_YET_VALID') || err.message.includes('certificate is not yet valid') || err.message.includes('Could not connect to any servers'))) {
      await mongoose.connect(env.MONGODB_URI, { tlsAllowInvalidCertificates: true });
      return { memory: false };
    }
    throw err;
  }
  return { memory: false };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
