import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'
import App from './App'

const root = document.getElementById('root')!

createRoot(root).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#20283B',
          border: '1px solid #E8E7EE',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 16px rgba(32,40,59,0.10)',
        },
        success: {
          iconTheme: { primary: '#27866B', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#C75D63', secondary: '#fff' },
        },
      }}
    />
  </StrictMode>
)
