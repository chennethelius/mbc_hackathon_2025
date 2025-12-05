import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Providers from './Providers.jsx'
import { Buffer } from 'buffer'

// Polyfill Buffer for browser
window.Buffer = Buffer

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
