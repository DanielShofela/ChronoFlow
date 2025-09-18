// Version de cache - À incrémenter à chaque déploiement majeur
const CACHE_VERSION = 'v2';
const CACHE_NAME = `chronoflow-${CACHE_VERSION}`;

// Liste des ressources à mettre en cache
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon_header.png'
];

// Liste des extensions de fichiers à mettre en cache
const CACHE_FILE_EXTENSIONS = [
  '.css',
  '.js',
  '.woff2',
  '.woff',
  '.ttf'
];

// Force le rechargement des ressources si la version change
const FORCE_CACHE_UPDATE = true;

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force le rechargement des ressources même si elles sont déjà en cache
      if (FORCE_CACHE_UPDATE) {
        return cache.keys().then((keys) => {
          return Promise.all([
            ...keys.map(key => cache.delete(key)), // Supprime l'ancien cache
            cache.addAll(CACHED_ASSETS) // Ajoute les nouvelles ressources
          ]);
        });
      }
      return cache.addAll(CACHED_ASSETS);
    })
  );
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Supprime tous les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('chronoflow-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Notifie l'application qu'une mise à jour est disponible
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_VERSION
          });
        });
      })
    ])
  );
  // Prend le contrôle immédiatement
  self.clients.claim();
});

// Stratégie de cache : Cache First pour les ressources statiques, Network First pour le reste
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCacheFirst = CACHE_FILE_EXTENSIONS.some(ext => url.pathname.endsWith(ext)) ||
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