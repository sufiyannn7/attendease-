// Verifies the configured MONGODB_URI actually accepts a connection.
require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI is not set in backend/.env'); process.exit(1); }
(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('Atlas connection OK — database:', mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Atlas connection FAILED:', e.message);
    process.exit(1);
  }
})();
