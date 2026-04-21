import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { PresenceManager } from '@/lib/presence'


// Prevent user scaling on mobile
const preventZoom = () => {
  let lastTouchEnd = 0;
  
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener('gesturestart', function (event) {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', function (event) {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('gestureend', function (event) {
    event.preventDefault();
  }, { passive: false });

  // Prevent double-tap zoom
  let lastTap = 0;
  document.addEventListener('touchend', function (event) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      event.preventDefault();
    }
    lastTap = currentTime;
  }, { passive: false });
};

preventZoom();

// Implement a global error handler to catch any unhandled errors
window.onerror = function(_message, _source, _lineno, _colno, _error) {
  console.error('Global error caught:')
  return false
}

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
} else {
  // Start presence tracking only on authenticated pages (avoid on public/share)
  setTimeout(() => {
    try {
      const token = localStorage.getItem('token')
      const isPublicShare = window.location.pathname.startsWith('/share/')
      if (token && !isPublicShare) {
        new PresenceManager(() => window.location.pathname)
      }
    } catch {}
  }, 0)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  )
} 

// Cross-tab listener: when user_id changes (login/logout in another tab),
// clear in-memory caches and rehydrate chat store accordingly.
try {
  window.addEventListener('storage', async (ev: StorageEvent) => {
    if (ev.key === 'user_id') {
      try { (await import('@/lib/storeCache')).clearStoreCache(); } catch {}
      try {
        const mod = await import('@/stores/chatStore');
        const useChatStore: any = (mod as any).default;
        if (useChatStore?.persist?.rehydrate) {
          await useChatStore.persist.rehydrate();
        }
      } catch {}
    }
  });
} catch {}