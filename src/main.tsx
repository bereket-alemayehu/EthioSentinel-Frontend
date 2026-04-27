import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from '@/app/routes/AppRouter'
import '@/styles/global.css'
import '@/shared/lib/i18n'
import { AppProvider } from '@/app/providers/AppProvider'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for offline support
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>,
)
