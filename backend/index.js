const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const seed = require('./utils/seed');
const User = require('./models/User.model');
// AttendEase API Server entry point - Atlas connected
(async () => {
  try {
    const { memory } = await connectDB();
    if (memory && (await User.countDocuments()) === 0) {
      await seed();
      console.log('Demo data seeded (in-memory database was empty).');
      console.log('\nDemo accounts:');
      console.log('  Teacher: prof@demo.com / Demo@1234');
      console.log('  Student: aarav@demo.com / Demo@1234\n');
    }
    app.listen(env.PORT, () => console.log(`AttendEase API listening on http://localhost:${env.PORT}`));
  } catch (err) {
    console.error('\n==================== [DATABASE CONNECTION ERROR] ====================');
    console.error('Failed to connect to MongoDB:\n', err.message);
    if (env.MONGODB_URI && env.MONGODB_URI.includes('irrlqbm.mongodb.net')) {
      console.error('\n[!] CAUSE DETECTED:');
      console.error('The MONGODB_URI in backend/.env is pointing to an outdated/deleted template cluster (meetagarwal0786_db_user @ irrlqbm.mongodb.net).');
      console.error('This is NOT your Atlas cluster! Even with 0.0.0.0/0 whitelisted in your Atlas, this connection will fail because that host does not exist.\n');
      console.error('[!] HOW TO FIX:');
      console.error('Option A (Quick local run):');
      console.error('  Set USE_MEMORY_DB=true in backend/.env to run instantly with the local database.\n');
      console.error('Option B (Use your MongoDB Atlas cluster):');
      console.error('  1. In MongoDB Atlas, go to "Database" -> click "Connect" on your cluster.');
      console.error('  2. Choose "Drivers" (Node.js) and copy your connection string:');
      console.error('     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/AttendEase?retryWrites=true&w=majority');
      console.error('  3. Replace MONGODB_URI in backend/.env with your real connection string.');
      console.error('======================================================================\n');
    }
    process.exit(1);
  }
})();
