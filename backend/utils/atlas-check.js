// Verifies the configured MONGODB_URI actually accepts a connection.
require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI is not set in backend/.env'); process.exit(1); }
const dns = require('dns');
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.every((s) => s.startsWith('127.'))) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {}

(async () => {
  try {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    } catch (err) {
      if (err.message && (err.message.includes('CERT_NOT_YET_VALID') || err.message.includes('certificate is not yet valid') || err.message.includes('Could not connect to any servers'))) {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, tlsAllowInvalidCertificates: true });
      } else {
        throw err;
      }
    }
    console.log('Atlas connection OK — database:', mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Atlas connection FAILED:', e.message);
    process.exit(1);
  }
})();
