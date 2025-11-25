// Custom Service Worker for Jumble PWA
// Enhanced version with better caching strategies

const CACHE_NAME = 'jumble-cache-v2';
const STATIC_CACHE_NAME = 'jumble-static-v2';
const IMAGE_CACHE_NAME = 'jumble-images-v2';
const API_CACHE_NAME = 'jumble-api-v2';
const FONT_CACHE_NAME = 'jumble-fonts-v2';
const ESM_CACHE_NAME = 'jumble-esm-v2';
const POST_CACHE_NAME = 'jumble-posts-v2';
const USER_CACHE_NAME = 'jumble-user-v2';

// Cache URLs - will be dynamically populated
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/sw.js',
  '/offline.html',
  '/pwa-test.html',
  '/offline-test.html',
  '/ios-fallback.html',
  '/ios-compatibility.js',
  '/cache-test.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
        // 即使某些资源缓存失败，也要继续激活
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('🧹 Cleaning up old caches...');
      const currentCaches = [
        STATIC_CACHE_NAME, 
        IMAGE_CACHE_NAME, 
        API_CACHE_NAME, 
        FONT_CACHE_NAME, 
        ESM_CACHE_NAME,
        POST_CACHE_NAME,
        USER_CACHE_NAME
      ];
      
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log(`🗑️  Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated successfully');
      return self.clients.claim();
    }).catch((error) => {
      console.error('❌ Service Worker activation failed:', error);
    })
  );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Handle different URL patterns
  if (url.origin === self.location.origin) {
    // Same origin requests
    if (isImageRequest(event.request)) {
      // Image files - Cache First
      event.respondWith(handleImageRequest(event.request));
    } else if (isFontRequest(event.request)) {
      // Font files - Cache First
      event.respondWith(handleFontRequest(event.request));
    } else if (isStaticRequest(event.request)) {
      // Static files - Stale While Revalidate
      event.respondWith(handleStaticRequest(event.request));
    } else if (isAPIRequest(event.request)) {
      // API requests - Network First
      event.respondWith(handleAPIRequest(event.request));
    } else if (isPostRequest(event.request)) {
      // Post/Nostr requests - Special caching
      event.respondWith(handlePostRequest(event.request));
    } else {
      // Other same origin requests - Network First
      event.respondWith(handleNetworkFirstRequest(event.request));
    }
  } else if (isESMRequest(event.request)) {
    // ESM modules - Cache First with long expiration
    event.respondWith(handleESMRequest(event.request));
  } else {
    // Other cross-origin requests - Stale While Revalidate
    event.respondWith(handleCrossOriginRequest(event.request));
  }
});

// Request type detection functions
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(png|jpg|jpeg|svg|gif|webp|ico|bmp)$/i.test(url.pathname);
}

function isFontRequest(request) {
  const url = new URL(request.url);
  return /\.(woff|woff2|ttf|eot|otf)$/i.test(url.pathname);
}

function isStaticRequest(request) {
  const url = new URL(request.url);
  return /\.(js|css|html|json|webmanifest)$/i.test(url.pathname) || 
         url.pathname === '/' || 
         url.pathname.endsWith('.html');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') || 
         url.pathname.includes('/v1/') ||
         url.pathname.includes('/rpc/');
}

function isPostRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/relay/') || 
         url.pathname.includes('/nostr') ||
         url.searchParams.has('event') ||
         url.searchParams.has('post') ||
         url.pathname.includes('/posts/');
}

function isESMRequest(request) {
  const url = new URL(request.url);
  return url.hostname === 'esm.sh' || 
         url.hostname === 'cdn.skypack.dev' ||
         url.hostname === 'unpkg.com';
}

// Request handlers
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`🖼️  Serving image from cache: ${request.url}`);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log(`🖼️  Cached image: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Image fetch failed:', error);
    throw error;
  }
}

async function handleFontRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`🔤 Serving font from cache: ${request.url}`);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(FONT_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log(`🔤 Cached font: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Font fetch failed:', error);
    throw error;
  }
}

async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request);
    
    if (cachedResponse) {
      // Return cached response immediately, but update cache in background
      fetchPromise.then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = caches.open(STATIC_CACHE_NAME);
          cache.then(c => c.put(request, networkResponse.clone()));
        }
      });
      console.log(`📄 Serving static file from cache: ${request.url}`);
      return cachedResponse;
    }
    
    const networkResponse = await fetchPromise;
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log(`📄 Cached static file: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Static file fetch failed:', error);
    throw error;
  }
}

async function handleAPIRequest(request) {
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
        // Clone the response to cache it
        const responseToCache = networkResponse.clone();
        cache.put(request, responseToCache);
        console.log(`🌐 API response cached: ${request.url}`);
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network request failed, trying cache:', networkError);
    }
    
    // Fall back to cache if network failed
    if (cachedResponse) {
      console.log(`📦 Serving API response from cache: ${request.url}`);
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  } catch (error) {
    console.error('❌ API fetch failed:', error);
    throw error;
  }
}

async function handlePostRequest(request) {
  try {
    const cache = await caches.open(POST_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // For GET requests (reading posts), try cache first
    if (request.method === 'GET') {
      if (cachedResponse) {
        console.log(`📝 Serving post from cache: ${request.url}`);
        // Update cache in background
        fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
        });
        return cachedResponse;
      }
    }
    
    // For all requests, try network
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses for GET requests
        if (request.method === 'GET') {
          cache.put(request, networkResponse.clone());
          console.log(`📝 Cached post: ${request.url}`);
        }
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network request failed, trying cache:', networkError);
    }
    
    // Fall back to cache for GET requests
    if (request.method === 'GET' && cachedResponse) {
      console.log(`📝 Serving post from cache (fallback): ${request.url}`);
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  } catch (error) {
    console.error('❌ Post fetch failed:', error);
    throw error;
  }
}

async function handleESMRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(`📦 Serving ESM module from cache: ${request.url}`);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(ESM_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log(`📦 Cached ESM module: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ ESM fetch failed:', error);
    throw error;
  }
}

async function handleNetworkFirstRequest(request) {
  try {
    const cache = await caches.open(USER_CACHE_NAME);
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
      console.log(`📦 Serving from cache: ${request.url}`);
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  } catch (error) {
    console.error('❌ Network first fetch failed:', error);
    throw error;
  }
}

async function handleCrossOriginRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request);
    
    if (cachedResponse) {
      fetchPromise.then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, networkResponse));
        }
      });
      console.log(`🌐 Serving cross-origin from cache: ${request.url}`);
      return cachedResponse;
    }
    
    const networkResponse = await fetchPromise;
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log(`🌐 Cached cross-origin: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Cross-origin fetch failed:', error);
    throw error;
  }
}

// Handle push notifications
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

// Handle message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Jumble Service Worker loaded');