const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('../config/db');
const seed = require('./seed');
const User = require('../models/User.model');

(async () => {
  await connectDB();
  if ((await User.countDocuments()) > 0) {
    console.log('Database already has users — skipping seed.');
  } else {
    await seed();
    console.log('Demo data seeded. Every demo user password:', seed.DEMO_PASSWORD);
  }
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
