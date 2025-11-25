import './i18n'
import './index.css'
import './polyfill'
import './services/lightning.service'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Initialize offline storage service
import './services/offline-storage.service'

// PWA Installation Prompt Handler
let deferredPrompt: any

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt = e
  console.log('PWA install prompt available')

  // You can show a custom install button here
  // For example: showInstallButton()
})

window.addEventListener('appinstalled', () => {
  // Hide the app-provided install promotion
  // hideInstallButton()
  // Clear the deferredPrompt so it can be garbage collected
  deferredPrompt = null
  console.log('PWA was installed')
})

// Handle online/offline status
const updateOnlineStatus = () => {
  const status = navigator.onLine ? 'online' : 'offline'
  console.log(`App is ${status}`)
  document.body.classList.toggle('offline', !navigator.onLine)

  // You can dispatch a custom event for React components to listen to
  window.dispatchEvent(new CustomEvent('online-status-changed', {
    detail: { online: navigator.onLine }
  }))
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

// Initialize online status
updateOnlineStatus()

const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`)
}
window.addEventListener('resize', setVh)
window.addEventListener('orientationchange', setVh)
setVh()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
