// =================================================================================
// ORION SERVICE WORKER - Performance & Offline-First
// =================================================================================

const CACHE_NAME = 'orion-cache-v1';
const STATIC_CACHE_NAME = 'orion-static-v1';
const DYNAMIC_CACHE_NAME = 'orion-dynamic-v1';

// Assets críticos para precachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap'
];

// URLs que requieren network-first
const NETWORK_FIRST_URLS = [
  '/src/firebase-config.js',
  '/src/firebase-init.js',
  '/src/auth.js',
  '/src/utils/storage.js'
];

// =================================================================================
// INSTALL EVENT - Precache assets críticos
// =================================================================================
self.addEventListener('install', (event) => {
  console.log('🔧 ORION Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Precaching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

// =================================================================================
// ACTIVATE EVENT - Limpiar caches antiguos
// =================================================================================
self.addEventListener('activate', (event) => {
  console.log('🚀 ORION Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches que no coincidan con la versión actual
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('orion-')) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ ORION Service Worker: Activated and ready!');
        // Tomar control de todas las pestañas inmediatamente
        return self.clients.claim();
      })
  );
});

// =================================================================================
// FETCH EVENT - Estrategias de cache inteligentes
// =================================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Excluir dominios críticos que no debemos interceptar
  const excludedDomains = [
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'fonts.gstatic.com',
    'fonts.googleapis.com'
  ];
  
  if (excludedDomains.some(domain => url.hostname.includes(domain))) {
    return; // No interceptar estos requests
  }
  
  // Estrategia Cache-First para assets estáticos
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Estrategia Network-First para datos dinámicos
  if (isNetworkFirstUrl(request)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Estrategia Stale-While-Revalidate para otros recursos
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// =================================================================================
// ESTRATEGIAS DE CACHE
// =================================================================================

// Cache First - Para assets que no cambian
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔴 Cache-first failed for:', request.url);
    return getOfflineFallback(request);
  }
}

// Network First - Para datos que pueden cambiar
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Stale While Revalidate - Lo mejor de ambos mundos
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// =================================================================================
// UTILIDADES
// =================================================================================

function isStaticAsset(request) {
  const url = request.url;
  return url.includes('cdn.tailwindcss.com') ||
         url.includes('fonts.googleapis.com') ||
         url.includes('cdn.jsdelivr.net') ||
         url.includes('feather-icons') ||
         url.includes('sortablejs') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.svg') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.ico');
}

function isNetworkFirstUrl(request) {
  return NETWORK_FIRST_URLS.some(pattern => request.url.includes(pattern));
}

function getOfflineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/index.html');
  }
  
  // Fallback básico para otros tipos de request
  return new Response('Offline - ORION está trabajando en modo local', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// =================================================================================
// BACKGROUND SYNC PREPARATION - Enhanced
// =================================================================================
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'orion-data-sync') {
    event.waitUntil(handleDataSync());
  } else if (event.tag === 'orion-emergency-sync') {
    event.waitUntil(handleEmergencySync());
  }
});

async function handleDataSync() {
  try {
    // Intentar sincronizar datos pendientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'sync-data',
        timestamp: Date.now()
      });
    });
    
    console.log('✅ Background sync completado');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    throw error; // Esto hará que el sync se reintente
  }
}

async function handleEmergencySync() {
  try {
    // Sincronización de emergencia para datos críticos
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'emergency-sync',
        priority: 'high',
        timestamp: Date.now()
      });
    });
    
    console.log('🚨 Emergency sync completado');
  } catch (error) {
    console.error('❌ Emergency sync failed:', error);
    throw error;
  }
}

// =================================================================================
// PERIODIC BACKGROUND SYNC
// =================================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'orion-periodic-sync') {
    console.log('⏰ Periodic sync triggered');
    event.waitUntil(handlePeriodicSync());
  }
});

async function handlePeriodicSync() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        action: 'maintenance-sync',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('❌ Periodic sync failed:', error);
  }
}

// =================================================================================
// MENSAJE HANDLER
// =================================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames.length,
    version: CACHE_NAME,
    timestamp: new Date().toISOString()
  };
  return status;
}

console.log('🌟 ORION Service Worker loaded and ready for action!');
