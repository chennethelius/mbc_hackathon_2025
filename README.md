# MBC Hackathon 2025

A React application with Supabase authentication built with Vite.

## Features

- 🔐 User authentication (Login/Signup) with Privy & Supabase
- 🎨 Modern, responsive UI with Tea App-inspired pastel theme
- 🎨 Centralized TypeScript theme system for consistent styling
- 💼 Embedded wallet functionality
- 🚀 Fast development with Vite and HMR
- ✨ Beautiful modals and forms with validation

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
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Privy** - Web3 authentication and embedded wallets
- **Supabase** - Backend as a Service (Authentication & Database)
- **React Router** - Client-side routing

## Design System & Theme

This project uses a centralized theme system for consistent styling across all components.

### Theme Files

- **`src/theme.ts`** - Main theme configuration (colors, spacing, typography, etc.)
- **`src/theme.d.ts`** - TypeScript type definitions
- **`src/hooks/useTheme.ts`** - React hook for accessing theme
- **`src/index.css`** - CSS variables that mirror theme.ts
- **`THEME_GUIDE.md`** - Complete theme documentation

### Color Palette (Tea App Inspired)

The app uses a vivid pastel color palette with solid colors (no gradients):

- **Cream** (`#FFF8E1`) - Page backgrounds
- **Lavender** (`#E0CCFF`) - Cards and primary sections
- **Mint Green** (`#A0FFB0`) - Primary action buttons
- **Pink** (`#FFD4D4`) - Secondary buttons
- **Sky Blue** (`#C5E4FF`) - Info elements
- **Purple** (`#D4B5FF`) - Links and highlights

### Using the Theme

**In CSS files:**
```css
.my-component {
  background: var(--lavender);
  color: var(--text-primary);
  border: var(--border-thin);
  border-radius: var(--border-radius-md);
}
```

**In React/TypeScript components:**
```typescript
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const theme = useTheme();
  return (
    <div style={{
      backgroundColor: theme.colors.mintGreen,
      padding: theme.spacing.md
    }}>
      Content
    </div>
  );
}
```

See **`THEME_GUIDE.md`** for complete documentation and best practices.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
