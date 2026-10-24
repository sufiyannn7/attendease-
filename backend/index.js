const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const seed = require('./utils/seed');
const User = require('./models/User.model');

(async () => {
  const { memory } = await connectDB();
  if (memory && (await User.countDocuments()) === 0) {
    await seed();
    console.log('Demo data seeded (in-memory database was empty).');
  }
  app.listen(env.PORT, () => console.log(`AttendEase API listening on http://localhost:${env.PORT}`));
})().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
