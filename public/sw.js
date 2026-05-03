const CACHE_NAME = 'nox-chat-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/bg_escuro.webp',
  '/nox_vert.webp',
  '/pwaicon/icon-192.png',
  '/pwaicon/icon-512.png'
];

// Instalação com log de progresso
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v4...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[SW] Skip cache: ${url}`);
        }
      }
    })
  );
  self.skipWaiting();
});

// Ativação e Limpeza de Caches Antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia de Fetch: Stale-While-Revalidate para Assets, Network-First para API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Não interferir em chamadas de API ou Auth (Sempre rede)
  if (url.pathname.includes('/api/')) return;

  // 2. Estratégia para Assets (Imagens, Scripts, Estilos)
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // Só cacheia se for uma resposta válida do nosso domínio
          if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
