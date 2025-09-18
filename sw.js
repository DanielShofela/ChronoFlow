// Version de cache - Utilisation d'un timestamp pour forcer la mise à jour
const CACHE_VERSION = 'v4.' + Date.now();
const CACHE_NAME = `chronoflow-${CACHE_VERSION}`;

// Liste des ressources à mettre en cache
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon_header.png',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/',
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/emoji.json'
];

// Liste des extensions de fichiers à mettre en cache
const CACHE_FILE_EXTENSIONS = [
  '.css',
  '.js',
  '.woff2',
  '.woff',
  '.ttf'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  // Ne pas skipWaiting automatiquement en production
  if (process.env.NODE_ENV === 'development') {
    self.skipWaiting();
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Installation des caches
      await cache.addAll(CACHED_ASSETS);
      
      // Notifier d'une mise à jour disponible
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: CACHE_VERSION
        });
      });
    })
  );
});

// Écoute des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting().then(() => {
      // Prendre le contrôle après skipWaiting
      clients.claim();
      
      // Notifier que la nouvelle version est activée
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    });
  }
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('chronoflow-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  
  // En développement, prendre le contrôle immédiatement
  if (process.env.NODE_ENV === 'development') {
    clients.claim();
  }
});

// Stratégie de cache : Cache First pour les ressources statiques et les emojis, Network First pour le reste
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isEmoji = url.href.includes('emoji-datasource-apple');
  const isCacheFirst = isEmoji || 
                      CACHE_FILE_EXTENSIONS.some(ext => url.pathname.endsWith(ext)) ||
                      CACHED_ASSETS.includes(url.pathname);

  event.respondWith(
    (isCacheFirst
      ? // Cache First pour les ressources statiques
        caches.match(event.request)
          .then(cachedResponse => cachedResponse || fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            }))
      : // Network First pour le reste
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              if (event.request.mode === 'navigate') {
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => {
                    client.postMessage({
                      type: 'USING_CACHED_VERSION',
                      version: CACHE_VERSION
                    });
                  });
                });
              }
              return cachedResponse;
            }
            
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return new Response('', {
              status: 404,
              statusText: 'Not Found'
            });
          })
    )
  );
});