# Privy + Supabase Integration Setup Guide

This guide will walk you through setting up the Privy-first authentication with Supabase data storage.

## Architecture Overview

```
User Login Flow:
1. User enters email → Privy sends OTP
2. User enters code → Privy authenticates
3. Privy auto-creates embedded wallet
4. Frontend syncs user data to Supabase
5. User profile loaded from Supabase
```

## 🗄️ Step 1: Set Up Supabase Database (Fresh Start)

### Run the SQL Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `supabase_migration.sql` from your project root
6. Copy and paste ALL the contents into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will create fresh tables: `users`, `profiles`, and `wallets`.

### Verify Tables Were Created

Run this query to confirm:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'profiles', 'wallets');
```

You should see three tables:
- `users`
- `profiles`
- `wallets`

## 🔐 Step 2: Verify Environment Variables

Make sure your `.env` file has:

```env
# Privy Credentials
VITE_PRIVY_APP_ID=cmirwdt0y00zwl80c56vebnmo
VITE_PRIVY_CLIENT_ID=client-WY6TPZvXVRedfRU4zXLVPrYSAsSPA3u5ydQSsLKWJzJHS

# Supabase Credentials
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🧪 Step 3: Test the Complete Flow

### Test User Registration (New User)

1. **Open your app** at `http://localhost:5173`
2. **Click "Login"** in the navbar
3. **Enter a .edu email** (e.g., `test@university.edu`)
4. **Click "Send Verification Code"**
5. **Check your email** for the OTP code
6. **Enter the code** and click "Login"

### What Should Happen:

✅ **Privy authenticates the user**
✅ **Privy creates an embedded wallet automatically**
✅ **Frontend syncs to Supabase** (watch browser console)
✅ **User is redirected to Home page**
✅ **Wallet address is displayed on Home page**

### Check Browser Console

You should see logs like:
```
🔄 Starting Privy → Supabase sync for user: did:privy:xxxxx
🔄 Syncing Privy user to Supabase...
✅ Profile created for user: did:privy:xxxxx
✅ Wallet synced for user: did:privy:xxxxx
✅ User sync completed successfully
```

### Verify in Supabase

1. Go to **Table Editor** in Supabase
2. Check the `users` table - should have 1 row
3. Check the `profiles` table - should have 1 row
4. Check the `wallets` table - should have 1 row with wallet address

## 🎯 Step 4: Test Profile Management

1. **Click Settings** (gear icon) in navbar
2. **Navigate to Profile tab**
3. Fill in:
   - University
   - Grade
   - Location
   - Bio
4. **Click "Save Profile"**
5. You should see "Profile saved successfully!"

### Verify Profile Saved

1. Go to Supabase **Table Editor**
2. View the `profiles` table
3. Your profile data should be there

## 🔁 Step 5: Test Login (Existing User)

1. **Logout** from the app
2. **Click "Login"** again
3. **Use the same email** as before
4. **Complete OTP verification**

### What Should Happen:

✅ **User logs in successfully**
✅ **Sync service recognizes existing user** (won't create duplicate)
✅ **Profile data loads automatically**
✅ **Wallet info is available**

Check console logs:
```
✅ Profile already exists for user: did:privy:xxxxx
✅ Wallet already synced for user: did:privy:xxxxx
```

## 🔍 Step 6: Test Account Tab

1. Go to **Settings**
2. Click **Account** tab
3. You should see:
   - Email address
   - User ID (Privy ID)
   - Account creation date
   - Wallet status (✓ Wallet Created)
   - Wallet address
   - "View Wallet →" button

## 💼 Step 7: Test Wallet Page

1. Click **💼 Wallet** in navbar
2. You should see:
   - User email
   - User ID
   - Wallet address
   - Send Transaction form

## 🐛 Troubleshooting

### Issue: "No wallet found yet"

**Solution:**
- Privy creates wallets automatically, but there may be a delay
- Click "Create Wallet Manually" button
- Refresh the page

### Issue: "Error syncing user to Supabase"

**Check:**
1. Supabase credentials are correct in `.env`
2. Tables exist in Supabase
3. RLS policies are enabled
4. Browser console for detailed error

**Common Fix:**
```sql
-- If RLS is too restrictive, temporarily allow all:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
```

### Issue: Profile not saving

**Check:**
1. User is authenticated
2. Privy user ID exists
3. `profiles` table has correct schema
4. Check browser console for errors

## 📊 Database Schema Reference

### `users` Table
- `id` (TEXT) - Privy user ID (Primary Key)
- `email` (TEXT) - User email
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `profiles` Table
- `id` (TEXT) - Links to users.id
- `email` (TEXT)
- `username` (TEXT)
- `display_name` (TEXT)
- `university` (TEXT)
- `grade` (TEXT)
- `location` (TEXT)
- `bio` (TEXT)
- `avatar_url` (TEXT)
- `updated_at` (TIMESTAMP)

### `wallets` Table
- `id` (SERIAL) - Auto-increment ID
- `user_id` (TEXT) - Links to users.id
- `wallet_address` (TEXT) - Blockchain address
- `wallet_type` (TEXT) - 'privy_embedded'
- `created_at` (TIMESTAMP)

## 🎉 Success Checklist

- [ ] SQL migration completed successfully
- [ ] Environment variables configured
- [ ] User can login with email OTP
- [ ] Wallet is auto-created
- [ ] User data syncs to Supabase
- [ ] Profile can be edited and saved
- [ ] Account tab shows wallet info
- [ ] Wallet page is accessible
- [ ] Existing user can login again
- [ ] No duplicate records in database

## 🚀 What's Next?

Now that your authentication + wallet system is working, you can:

1. **Add more profile fields** - Extend the `profiles` table
2. **Build team features** - Create teams table linking to users
3. **Add transactions** - Store transaction history
4. **Implement notifications** - User notifications table
5. **Add social features** - Follow system, posts, etc.

Your Privy + Supabase integration is complete! 🎊

