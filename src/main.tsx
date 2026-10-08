import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'

// Pre-warm backend immediately to minimize cold start latency
try {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  fetch(`${base}/api/health/`, { method: 'GET', keepalive: true }).catch(() => {});
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
