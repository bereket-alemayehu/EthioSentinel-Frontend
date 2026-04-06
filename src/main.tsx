import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/i18n'
import { AppProvider } from './providers/AppProvider'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for offline support
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
