-- Supabase Clean Migration for Privy + Supabase Integration
-- This drops existing tables and creates fresh ones
-- Run this in your Supabase SQL Editor

-- =============================================
-- WARNING: This will delete existing data!
-- If you have important data, backup first!
-- =============================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. CREATE USERS TABLE
-- =============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. CREATE PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  display_name TEXT,
  university TEXT,
  grade TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. CREATE WALLETS TABLE
-- =============================================
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT DEFAULT 'privy_embedded',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. CREATE INDEXES
-- =============================================
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_username ON profiles(username);

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Users table policies
CREATE POLICY "Allow public insert users" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read all data" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update all data" ON users
  FOR UPDATE
  USING (true);

-- Profiles table policies
CREATE POLICY "Allow public insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update all profiles" ON profiles
  FOR UPDATE
  USING (true);

-- Wallets table policies
CREATE POLICY "Allow public insert wallets" ON wallets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read wallets" ON wallets
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update all wallets" ON wallets
  FOR UPDATE
  USING (true);

-- =============================================
-- MIGRATION COMPLETE ✅
-- =============================================
SELECT 'Migration completed successfully!' as status;

