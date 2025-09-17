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

// Stratégie de cache : Network First avec validation de version
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la requête réseau réussit, mettre à jour le cache
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        
        // Si nous avons une réponse en cache
        if (cachedResponse) {
          // Vérifie si c'est une navigation vers la page principale
          if (event.request.mode === 'navigate') {
            // Notifie l'application que nous utilisons une version en cache
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

        // Si pas de cache pour une navigation, retourne la page d'accueil
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }

        // Sinon retourne une erreur 404
        return new Response('', {
          status: 404,
          statusText: 'Not Found'
        });
      })
  );
});