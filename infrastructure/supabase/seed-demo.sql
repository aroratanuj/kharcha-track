-- Demo Data Seed Script for Kharcha-Track
-- Run this in Supabase SQL Editor or via psql
-- Demo Login: demo@kharcha.com / password: demo1234

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create demo user
-- Password: demo1234 (bcrypt hashed with salt round 10)
INSERT INTO users (id, email, password_hash, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@kharcha.com', '$2b$10$3bHsNtBWJUdU2q0vracX9u36O08ZWK5rdi1biq0lQG/eQVeRIQRp6', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- 2. Create default categories for demo user
INSERT INTO categories (name, color, icon, user_id)
SELECT name, color, icon, '00000000-0000-0000-0000-000000000001'
FROM (VALUES
  ('Food & Dining', '#FF6B6B', '🍔'),
  ('Transportation', '#4ECDC4', '🚗'),
  ('Shopping', '#45B7D1', '🛍️'),
  ('Entertainment', '#FFA07A', '🎬'),
  ('Bills & Utilities', '#98D8C8', '💡'),
  ('Healthcare', '#F7DC6F', '🏥'),
  ('Education', '#BB8FCE', '📚'),
  ('Travel', '#85C1E9', '✈️'),
  ('Groceries', '#82E0AA', '🛒'),
  ('Subscriptions', '#F8C471', '📱')
) AS v(name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

-- 3. Create sample expenses
INSERT INTO expenses (amount, description, merchant_name, date, status, category_id, user_id)
SELECT
  e.amount,
  e.description,
  e.merchant,
  e.expense_date::DATE,
  'confirmed',
  c.id,
  '00000000-0000-0000-0000-000000000001'
FROM (VALUES
  (450.00, 'Weekly groceries', 'Big Bazaar', CURRENT_DATE - INTERVAL '2 days', 'Food & Dining'),
  (120.00, 'Uber rides', 'Uber', CURRENT_DATE - INTERVAL '3 days', 'Transportation'),
  (2500.00, 'New headphones', 'Amazon', CURRENT_DATE - INTERVAL '5 days', 'Shopping'),
  (800.00, 'Movie tickets + dinner', 'BookMyShow', CURRENT_DATE - INTERVAL '7 days', 'Entertainment'),
  (1500.00, 'Electricity bill', 'Tata Power', CURRENT_DATE - INTERVAL '10 days', 'Bills & Utilities'),
  (350.00, 'Metro card recharge', 'DMRC', CURRENT_DATE - INTERVAL '12 days', 'Transportation'),
  (200.00, 'Coffee and snacks', 'Starbucks', CURRENT_DATE - INTERVAL '14 days', 'Food & Dining'),
  (999.00, 'Netflix + Spotify annual', 'Netflix', CURRENT_DATE - INTERVAL '15 days', 'Subscriptions'),
  (3000.00, 'Online course', 'Udemy', CURRENT_DATE - INTERVAL '18 days', 'Education'),
  (600.00, 'Pharmacy', 'Apollo Pharmacy', CURRENT_DATE - INTERVAL '20 days', 'Healthcare'),
  (150.00, 'Lunch at office', 'Zomato', CURRENT_DATE - INTERVAL '1 days', 'Food & Dining'),
  (500.00, 'Bus pass', 'BEST', CURRENT_DATE - INTERVAL '25 days', 'Transportation')
) AS e(amount, description, merchant, expense_date, category_name)
JOIN categories c ON c.name = e.category_name AND c.user_id = '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM expenses WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

-- 4. Create sample budgets for current month
INSERT INTO budgets (limit, spent, month, year, user_id, category_id)
SELECT
  b.budget_limit,
  0,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  '00000000-0000-0000-0000-000000000001',
  c.id
FROM (VALUES
  ('Food & Dining', 5000),
  ('Transportation', 3000),
  ('Shopping', 5000),
  ('Entertainment', 2000),
  ('Bills & Utilities', 3000),
  ('Subscriptions', 1500)
) AS b(category_name, budget_limit)
JOIN categories c ON c.name = b.category_name AND c.user_id = '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM budgets WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

-- Done! You can now login with:
-- Email: demo@kharcha.com
-- Password: demo1234
