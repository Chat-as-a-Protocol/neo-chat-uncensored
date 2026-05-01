const CACHE_NAME = 'nox-chat-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/pwaicon/android-icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Ignorar requisições não-GET (Chat, Auth, etc)
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // 2. Estratégia de Cache para Assets do Mesmo Domínio
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Só cacheia se a resposta for válida e do mesmo domínio
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              })
            );
          }
          return response;
        })
        .catch(() => {
          // Fallback Offline
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            // Se for uma navegação (mudança de página), retorna o App Shell (/)
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }

            // Fallback genérico
            return new Response('Offline: Resource not in cache', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  }
});
