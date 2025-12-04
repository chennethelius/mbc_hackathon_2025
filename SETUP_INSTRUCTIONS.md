# 🚀 Setup Instructions

## You're Almost Ready!

I've set up your entire authentication system with Supabase. Here's what you need to do to get it running:

---

## 📝 Step 1: Get Your Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click on the **Settings** icon (⚙️) in the left sidebar
3. Go to **API** section
4. Copy these two values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

---

## 🔑 Step 2: Create Your .env File

Create a file named `.env` in the root directory of your project (same level as package.json) with this content:

```bash
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

**Important:** Replace the placeholder values with your actual Supabase credentials!

---

## ✉️ Step 3: Enable Email Authentication in Supabase

1. In your Supabase Dashboard, go to **Authentication** in the left sidebar
2. Click on **Providers**
3. Make sure **Email** is **enabled** (it should be by default)
4. **(Optional)** For faster development testing:
   - Go to **Authentication** → **Settings**
   - Scroll to **Email Confirmation**
   - You can disable "Enable email confirmations" for development (but enable it for production!)

---

## 🎯 Step 4: Run Your App

In your terminal, run:

```bash
npm run dev
```

Then open your browser to the URL shown (usually http://localhost:5173)

---

## ✅ Testing Your Login System

1. Click the **Login** button in the top right corner
2. Click **Sign Up** to create a new account
3. Enter an email and password (minimum 6 characters)
4. If email confirmation is enabled, check your email
5. Try logging in with your credentials!

---

## 🎨 What's Been Created

- ✅ Navbar with Login button
- ✅ Beautiful Login/Signup modal
- ✅ Supabase authentication integration
- ✅ User session management
- ✅ Responsive design with gradients
- ✅ Error handling and loading states

---

## 🐛 Troubleshooting

**Problem:** "Invalid API key" error  
**Solution:** Double-check your `.env` file has the correct credentials

**Problem:** Can't sign up  
**Solution:** Make sure Email provider is enabled in Supabase Dashboard

**Problem:** Not receiving confirmation emails  
**Solution:** Check spam folder, or disable email confirmation in Supabase for development

---

## 🗄️ Step 5: Create the Profiles Table in Supabase

To enable profile features (university, grade, location, bio), you need to create a profiles table:

1. In your Supabase Dashboard, go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste this SQL:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  university text,
  grade text,
  location text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);
```

4. Click **Run** to execute the query
5. You should see "Success. No rows returned" message

---

## 📚 Next Steps

Once your login is working, you can:
- Add password reset functionality
- Implement OAuth (Google, GitHub, etc.)
- Build protected routes that require authentication
- Add user roles and permissions

---

Need help? Check the README.md file or the Supabase docs at https://supabase.com/docs

