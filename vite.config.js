import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Stub out Solana imports to prevent build errors
      '@solana-program/system': new URL('./src/stubs/solana-stub.js', import.meta.url).pathname,
    }
  }
})
