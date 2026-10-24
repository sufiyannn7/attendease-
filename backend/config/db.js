const mongoose = require('mongoose');
const env = require('./env');

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
  await mongoose.connect(env.MONGODB_URI);
  return { memory: false };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
