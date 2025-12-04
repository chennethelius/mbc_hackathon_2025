# MBC Hackathon 2025

A React application with Supabase authentication built with Vite.

## Features

- 🔐 User authentication (Login/Signup) with Supabase
- 🎨 Modern, responsive UI with gradient design
- 🚀 Fast development with Vite and HMR
- ✨ Beautiful login modal with form validation

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Enable Email Authentication in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) For development, you can disable email confirmation in **Authentication** → **Settings**

### 5. Run the Development Server

```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Navigation bar with login button
│   ├── Navbar.css
│   ├── LoginModal.jsx      # Login/Signup modal
│   └── LoginModal.css
├── services/
│   └── supabase.js         # Supabase client configuration
├── App.jsx                 # Main app component with auth logic
├── App.css
└── main.jsx
```

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Supabase** - Backend as a Service (Authentication & Database)
- **@supabase/supabase-js** - Supabase JavaScript client

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
