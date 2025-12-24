
const CACHE_NAME = 'f1-2026-v2';
const assets = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Força o Service Worker a se tornar ativo imediatamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('activate', event => {
  // Garante que o SW controle todas as abas abertas imediatamente
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Estratégia Network First para garantir dados atualizados da F1, 
  // mas permitindo funcionamento offline básico
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
