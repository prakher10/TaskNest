/**
 * Removes all seeded demo accounts and their data.
 * Keeps real user accounts untouched.
 * Usage: node scripts/clearDemo.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const DEMO_EMAILS = ['alex@demo.com', 'sarah@demo.com', 'james@demo.com', 'emily@demo.com'];

async function clear() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Find demo user IDs first
  const demoUsers = await db.collection('users').find({ email: { $in: DEMO_EMAILS } }).toArray();
  const demoIds = demoUsers.map((u) => u._id);

  // Delete demo users
  const u = await db.collection('users').deleteMany({ email: { $in: DEMO_EMAILS } });
  console.log(`Deleted ${u.deletedCount} demo user(s)`);

  // Delete projects created by demo users
  const p = await db.collection('projects').deleteMany({ createdBy: { $in: demoIds } });
  console.log(`Deleted ${p.deletedCount} demo project(s)`);

  // Delete tasks created by demo users
  const t = await db.collection('tasks').deleteMany({ createdBy: { $in: demoIds } });
  console.log(`Deleted ${t.deletedCount} demo task(s)`);

  console.log('\n✅ Demo data cleared. Only real accounts remain.');
  process.exit(0);
}

clear().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
