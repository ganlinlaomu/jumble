const CACHE_NAME = 'jumble-cache-v1';
const STATIC_CACHE_NAME = 'jumble-static-v1';
const IMAGE_CACHE_NAME = 'jumble-images-v1';
const API_CACHE_NAME = 'jumble-api-v1';
const FONT_CACHE_NAME = 'jumble-fonts-v1';
const ESM_CACHE_NAME = 'jumble-esm-v1';

// Cache URLs
const STATIC_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-monochrome.svg',
  '/manifest.webmanifest'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== FONT_CACHE_NAME && 
              cacheName !== ESM_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle different URL patterns
  if (url.origin === self.location.origin) {
    // Same origin requests
    if (url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.jpeg') || 
        url.pathname.endsWith('.svg') || 
        url.pathname.endsWith('.gif') || 
        url.pathname.endsWith('.webp') || 
        url.pathname.endsWith('.ico')) {
      // Image files - Cache First
      event.respondWith(handleImageRequest(event.request));
    } else if (url.pathname.endsWith('.woff') || 
               url.pathname.endsWith('.woff2') || 
               url.pathname.endsWith('.ttf') || 
               url.pathname.endsWith('.eot')) {
      // Font files - Cache First
      event.respondWith(handleFontRequest(event.request));
    } else if (url.pathname.endsWith('.js') || 
               url.pathname.endsWith('.css') || 
               url.pathname.endsWith('.html')) {
      // Static files - Stale While Revalidate
      event.respondWith(handleStaticRequest(event.request));
    } else {
      // Other same origin requests - Network First
      event.respondWith(handleNetworkFirstRequest(event.request));
    }
  } else if (url.hostname === 'esm.sh') {
    // ESM modules - Cache First with long expiration
    event.respondWith(handleEsmRequest(event.request));
  } else if (url.pathname.includes('/api/') || 
             url.pathname.includes('/relay/') || 
             url.pathname.includes('/nostr')) {
    // API/Nostr requests - Network First with short expiration
    event.respondWith(handleApiRequest(event.request));
  } else {
    // Other cross-origin requests - Stale While Revalidate
    event.respondWith(handleCrossOriginRequest(event.request));
  }
});

// Handle image requests - Cache First
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Image fetch failed:', error);
    throw error;
  }
}

// Handle font requests - Cache First
async function handleFontRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(FONT_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Font fetch failed:', error);
    throw error;
  }
}

// Handle static files - Stale While Revalidate
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request);
    
    if (cachedResponse) {
      // Return cached response immediately, but update cache in background
      fetchPromise.then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(STATIC_CACHE_NAME);
          cache.put(request, networkResponse);
        }
      });
      return cachedResponse;
    }
    
    const networkResponse = await fetchPromise;
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static file fetch failed:', error);
    throw error;
  }
}

// Handle ESM requests - Cache First
async function handleEsmRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(ESM_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('ESM fetch failed:', error);
    throw error;
  }
}

// Handle API requests - Network First
async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Try network first with timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 5000);
    });
    
    try {
      const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network request failed, trying cache:', networkError);
    }
    
    // Fall back to cache if network failed
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  } catch (error) {
    console.error('API fetch failed:', error);
    throw error;
  }
}

// Handle Network First requests
async function handleNetworkFirstRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network request failed, trying cache:', networkError);
    }
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  } catch (error) {
    console.error('Network first fetch failed:', error);
    throw error;
  }
}

// Handle cross-origin requests - Stale While Revalidate
async function handleCrossOriginRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request);
    
    if (cachedResponse) {
      fetchPromise.then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse);
        }
      });
      return cachedResponse;
    }
    
    const networkResponse = await fetchPromise;
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cross-origin fetch failed:', error);
    throw error;
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-monochrome.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});