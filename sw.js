// Version de cache - À incrémenter à chaque déploiement majeur
const CACHE_VERSION = 'v3';
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

// Force le rechargement des ressources si la version change
const FORCE_CACHE_UPDATE = true;

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_ASSETS).then(() => {
        // Forcer l'activation immédiate du SW
        self.skipWaiting();
      });
    })
  );
});

// Écoute des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Nettoyage des anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('chronoflow-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      // Prendre le contrôle de tous les clients
      clients.claim().then(() => {
        // Notifier tous les clients qu'une nouvelle version est disponible
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NEW_VERSION_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
      })
    ])
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