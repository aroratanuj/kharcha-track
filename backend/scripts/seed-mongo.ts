import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env');
  process.exit(1);
}

const GLOBAL_CATEGORIES = [
  { name: 'Food & Dining', color: '#FF6B6B', icon: '🍔' },
  { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
  { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
  { name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
  { name: 'Bills & Utilities', color: '#FFEAA7', icon: '💡' },
  { name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
  { name: 'Education', color: '#98D8C8', icon: '📚' },
  { name: 'Groceries', color: '#F7DC6F', icon: '🛒' },
  { name: 'Rent & Housing', color: '#BB8FCE', icon: '🏠' },
  { name: 'Other', color: '#AEB6BF', icon: '📦' },
];

const DEFAULT_ACCOUNT_SOURCES = [
  { label: 'Credit Card', icon: '💳', isActive: true },
  { label: 'Bank Account/UPI', icon: '🏦', isActive: true },
  { label: 'Cash', icon: '💵', isActive: true },
];

async function seedAccountSources(db) {
  const existing = await db.collection('account_sources').countDocuments();
  if (existing > 0) {
    console.log(`  Account sources already exist (${existing}), skipping...`);
    return;
  }
  const now = new Date();
  await db.collection('account_sources').insertMany(
    DEFAULT_ACCOUNT_SOURCES.map(s => ({ ...s, createdAt: now, updatedAt: now }))
  );
  const count = await db.collection('account_sources').countDocuments();
  console.log(`  Seeded ${count} account sources`);
}

async function seedCategories(db) {
  const existing = await db.collection('categories').countDocuments({ userId: null });
  if (existing > 0) {
    console.log(`  Categories already exist (${existing}), skipping...`);
    return;
  }
  const now = new Date();
  await db.collection('categories').insertMany(
    GLOBAL_CATEGORIES.map(c => ({ ...c, userId: null, createdAt: now, updatedAt: now }))
  );
  const count = await db.collection('categories').countDocuments({ userId: null });
  console.log(`  Seeded ${count} global categories`);
}

async function seedUsers(db) {
  const adminEmail = 'admin@kharcha.com';
  const demoEmail = 'demo@kharcha.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin1511';
  const demoPass = process.env.DEMO_PASSWORD || 'demo1234';
  const now = new Date();

  const adminExists = await db.collection('users').findOne({ email: adminEmail });
  if (!adminExists) {
    const hash = await bcrypt.hash(adminPass, 10);
    await db.collection('users').insertOne({ email: adminEmail, passwordHash: hash, fullName: 'Admin', role: 'admin', createdAt: now, updatedAt: now });
    console.log('  Seeded admin user (admin / admin1511)');
  } else {
    console.log('  Admin user already exists, skipping...');
  }

  const demoExists = await db.collection('users').findOne({ email: demoEmail });
  if (!demoExists) {
    const hash = await bcrypt.hash(demoPass, 10);
    await db.collection('users').insertOne({ email: demoEmail, passwordHash: hash, fullName: 'Demo User', role: 'user', createdAt: now, updatedAt: now });
    console.log('  Seeded demo user (demo@kharcha.com / demo1234)');
  } else {
    console.log('  Demo user already exists, skipping...');
  }
}

async function seedDemoExpenses(db) {
  const demoUser = await db.collection('users').findOne({ email: 'demo@kharcha.com' });
  if (!demoUser) {
    console.log('  Demo user not found, skipping expenses...');
    return;
  }

  const existing = await db.collection('expenses').countDocuments({ userId: demoUser._id });
  if (existing > 0) {
    console.log(`  Demo expenses already exist (${existing}), skipping...`);
    return;
  }

  const categories = await db.collection('categories').find({ userId: null }).toArray();
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c._id; });

  const now = new Date();
  const day = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const expenses = [
    { amount: 450, description: 'Weekly groceries', merchantName: 'Big Bazaar', date: day(2), status: 'confirmed', categoryName: 'Food & Dining', accountSource: 'Bank Account/UPI' },
    { amount: 120, description: 'Uber rides', merchantName: 'Uber', date: day(3), status: 'confirmed', categoryName: 'Transportation', accountSource: 'Bank Account/UPI' },
    { amount: 2500, description: 'New headphones', merchantName: 'Amazon', date: day(5), status: 'confirmed', categoryName: 'Shopping', accountSource: 'Credit Card' },
    { amount: 800, description: 'Movie tickets + dinner', merchantName: 'BookMyShow', date: day(7), status: 'confirmed', categoryName: 'Entertainment', accountSource: 'Bank Account/UPI' },
    { amount: 1500, description: 'Electricity bill', merchantName: 'Tata Power', date: day(10), status: 'confirmed', categoryName: 'Bills & Utilities', accountSource: 'Bank Account/UPI' },
    { amount: 350, description: 'Metro card recharge', merchantName: 'DMRC', date: day(12), status: 'confirmed', categoryName: 'Transportation', accountSource: 'Bank Account/UPI' },
    { amount: 200, description: 'Coffee and snacks', merchantName: 'Starbucks', date: day(14), status: 'confirmed', categoryName: 'Food & Dining', accountSource: 'Cash' },
    { amount: 999, description: 'Netflix + Spotify annual', merchantName: 'Netflix', date: day(15), status: 'confirmed', categoryName: 'Other', accountSource: 'Credit Card' },
    { amount: 3000, description: 'Online course', merchantName: 'Udemy', date: day(18), status: 'confirmed', categoryName: 'Education', accountSource: 'Credit Card' },
    { amount: 600, description: 'Pharmacy', merchantName: 'Apollo Pharmacy', date: day(20), status: 'confirmed', categoryName: 'Healthcare', accountSource: 'Cash' },
    { amount: 150, description: 'Lunch at office', merchantName: 'Zomato', date: day(1), status: 'confirmed', categoryName: 'Food & Dining', accountSource: 'Bank Account/UPI' },
    { amount: 500, description: 'Bus pass', merchantName: 'BEST', date: day(25), status: 'confirmed', categoryName: 'Transportation', accountSource: 'Cash' },
  ];

  await db.collection('expenses').insertMany(expenses.map(e => ({
    amount: e.amount,
    description: e.description,
    merchantName: e.merchantName,
    date: e.date,
    status: e.status,
    categoryId: catMap[e.categoryName] || null,
    userId: demoUser._id,
    accountSource: e.accountSource,
    createdAt: now,
    updatedAt: now,
  })));

  console.log(`  Seeded ${expenses.length} demo expenses`);
}

async function seedDemoBudgets(db) {
  const demoUser = await db.collection('users').findOne({ email: 'demo@kharcha.com' });
  if (!demoUser) {
    console.log('  Demo user not found, skipping budgets...');
    return;
  }

  const existing = await db.collection('budgets').countDocuments({ userId: demoUser._id });
  if (existing > 0) {
    console.log(`  Demo budgets already exist (${existing}), skipping...`);
    return;
  }

  const categories = await db.collection('categories').find({ userId: null }).toArray();
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c._id; });

  const now = new Date();
  const budgets = [
    { categoryName: 'Food & Dining', limit: 5000 },
    { categoryName: 'Transportation', limit: 3000 },
    { categoryName: 'Shopping', limit: 5000 },
    { categoryName: 'Entertainment', limit: 2000 },
    { categoryName: 'Bills & Utilities', limit: 3000 },
  ];

  await db.collection('budgets').insertMany(budgets.map(b => ({
    limit: b.limit,
    spent: 0,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    userId: demoUser._id,
    categoryId: catMap[b.categoryName],
    createdAt: now,
    updatedAt: now,
  })));

  console.log(`  Seeded ${budgets.length} demo budgets`);
}

async function showStats(db) {
  const users = await db.collection('users').countDocuments();
  const categories = await db.collection('categories').countDocuments();
  const expenses = await db.collection('expenses').countDocuments();
  const budgets = await db.collection('budgets').countDocuments();
  const accountSources = await db.collection('account_sources').countDocuments();

  console.log('\n  Database Statistics:');
  console.log('  ----------------------');
  console.log(`  Users:      ${users}`);
  console.log(`  Categories: ${categories}`);
  console.log(`  Expenses:   ${expenses}`);
  console.log(`  Budgets:    ${budgets}`);
  console.log(`  Acct Srcs:  ${accountSources}`);
  console.log('');
}

async function resetAll(db) {
  console.log('  Dropping all collections...');
  await db.collection('users').deleteMany({});
  await db.collection('categories').deleteMany({});
  await db.collection('expenses').deleteMany({});
  await db.collection('budgets').deleteMany({});
  await db.collection('account_sources').deleteMany({});
  console.log('  All collections cleared');
}

async function seedAll(db) {
  await seedAccountSources(db);
  await seedCategories(db);
  await seedUsers(db);
  await seedDemoExpenses(db);
  await seedDemoBudgets(db);
}

const command = process.argv[2] || 'all';

async function main() {
  const maskedUri = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`\n  Kharcha-Track — MongoDB Seed Script`);
  console.log(`  Connecting to ${maskedUri}...\n`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  switch (command) {
    case 'all':
      await seedAll(db);
      break;
    case 'categories':
      await seedCategories(db);
      break;
    case 'users':
      await seedUsers(db);
      break;
    case 'expenses':
      await seedDemoExpenses(db);
      break;
    case 'budgets':
      await seedDemoBudgets(db);
      break;
    case 'reset':
      await resetAll(db);
      console.log('  Database reset. Run "all" to reseed.\n');
      break;
    case 'stats':
      await showStats(db);
      break;
    default:
      console.log(`\n  Usage: npx ts-node scripts/seed-mongo.ts <command>\n`);
      console.log('  Commands:');
      console.log('    all         Seed everything (categories, users, expenses, budgets)');
      console.log('    categories  Seed global categories only');
      console.log('    users       Seed admin + demo user only');
      console.log('    expenses    Seed demo expenses only');
      console.log('    budgets     Seed demo budgets only');
      console.log('    reset       Drop all collections');
      console.log('    stats       Show document counts');
      console.log('');
      break;
  }

  if (command === 'all') {
    await showStats(db);
  }

  await client.close();
  console.log('  Done.\n');
}

main().catch(err => {
  console.error('  Seed error:', err.message);
  process.exit(1);
});
