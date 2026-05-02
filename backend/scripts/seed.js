/**
 * Seed script — populates the database with realistic demo data.
 *
 * Usage:
 *   node scripts/seed.js          # seed (skips if data already exists)
 *   node scripts/seed.js --force  # wipe and re-seed
 *
 * Creates:
 *   - 1 Admin user
 *   - 3 Member users
 *   - 3 Projects (Admin is creator, members are added)
 *   - 8 Tasks spread across projects
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const FORCE = process.argv.includes('--force');

const USERS = [
  { name: 'Alex Morgan',   email: 'alex@demo.com',   password: 'password123', role: 'Admin',  isVerified: true },
  { name: 'Sarah Chen',    email: 'sarah@demo.com',  password: 'password123', role: 'Member', isVerified: true },
  { name: 'James Patel',   email: 'james@demo.com',  password: 'password123', role: 'Member', isVerified: true },
  { name: 'Emily Rivera',  email: 'emily@demo.com',  password: 'password123', role: 'Member', isVerified: true },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB:', process.env.MONGO_URI);

  // ── Wipe if --force ──────────────────────────────────────────────────────────
  if (FORCE) {
    await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);
    console.log('Wiped existing data.');
  } else {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} user(s). Use --force to re-seed.`);
      process.exit(0);
    }
  }

  // ── Create users ─────────────────────────────────────────────────────────────
  const createdUsers = await Promise.all(
    USERS.map((u) => User.create(u))
  );
  const [admin, sarah, james, emily] = createdUsers;
  console.log(`Created ${createdUsers.length} users.`);

  // ── Create projects ───────────────────────────────────────────────────────────
  const projects = await Promise.all([
    Project.create({
      title: 'Website Redesign',
      description: 'Refresh marketing site with new brand guidelines and improved UX.',
      createdBy: admin._id,
      members: [admin._id, sarah._id, james._id, emily._id],
    }),
    Project.create({
      title: 'Mobile App Launch',
      description: 'Ship iOS & Android v1 with onboarding flow and analytics.',
      createdBy: admin._id,
      members: [admin._id, sarah._id, james._id],
    }),
    Project.create({
      title: 'API Migration',
      description: 'Migrate legacy endpoints to v2 with backward compatibility.',
      createdBy: admin._id,
      members: [admin._id, james._id, emily._id],
    }),
  ]);
  const [websiteProject, mobileProject, apiProject] = projects;
  console.log(`Created ${projects.length} projects.`);

  // ── Create tasks ──────────────────────────────────────────────────────────────
  const now = new Date();
  const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

  const tasks = await Task.insertMany([
    // Website Redesign tasks
    {
      title: 'Design new landing hero',
      description: 'Update the hero section with new copy and illustration.',
      status: 'In Progress',
      priority: 'High',
      dueDate: daysFromNow(6),
      assignedTo: sarah._id,
      projectId: websiteProject._id,
      createdBy: admin._id,
    },
    {
      title: 'Set up component library',
      status: 'Completed',
      priority: 'Medium',
      dueDate: daysFromNow(-3),
      assignedTo: james._id,
      projectId: websiteProject._id,
      createdBy: admin._id,
    },
    {
      title: 'QA cross-browser tests',
      status: 'Pending',
      priority: 'Medium',
      dueDate: daysFromNow(10),
      assignedTo: emily._id,
      projectId: websiteProject._id,
      createdBy: admin._id,
    },
    // Mobile App tasks
    {
      title: 'Onboarding flow wireframes',
      description: 'Design the 4-step onboarding screens.',
      status: 'In Progress',
      priority: 'High',
      dueDate: daysFromNow(3),
      assignedTo: sarah._id,
      projectId: mobileProject._id,
      createdBy: admin._id,
    },
    {
      title: 'Push notifications integration',
      status: 'Pending',
      priority: 'High',
      dueDate: daysFromNow(-1), // overdue
      assignedTo: james._id,
      projectId: mobileProject._id,
      createdBy: admin._id,
    },
    {
      title: 'App icon final assets',
      status: 'Completed',
      priority: 'Low',
      dueDate: daysFromNow(-10),
      assignedTo: sarah._id,
      projectId: mobileProject._id,
      createdBy: admin._id,
    },
    // API Migration tasks
    {
      title: 'Schema migration script',
      description: 'Write and test the DB migration for v2 schema.',
      status: 'Pending',
      priority: 'High',
      dueDate: daysFromNow(-2), // overdue
      assignedTo: emily._id,
      projectId: apiProject._id,
      createdBy: admin._id,
    },
    {
      title: 'Deprecation notice email',
      status: 'Completed',
      priority: 'Low',
      dueDate: daysFromNow(-7),
      assignedTo: james._id,
      projectId: apiProject._id,
      createdBy: admin._id,
    },
  ]);
  console.log(`Created ${tasks.length} tasks.`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('Demo accounts (all passwords: password123):');
  console.log('  Admin  → alex@demo.com');
  console.log('  Member → sarah@demo.com');
  console.log('  Member → james@demo.com');
  console.log('  Member → emily@demo.com');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
