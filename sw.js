
const CACHE_NAME = 'f1-2026-v8-pwa';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.log('Erro cache install:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ignora requisições não-GET (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') return;

  // Ignora requisições para APIs externas ou Firebase (opcional, mas recomendado para evitar cache de dados dinâmicos)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
     return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Estratégia: Stale-While-Revalidate
      // Retorna cache imediatamente se existir, mas busca atualização na rede em background
      
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Verifica se a resposta é válida antes de cachear
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
         // Se falhar o fetch (offline) e não tiver cache, o usuário verá o erro padrão do navegador
         // ou podemos retornar uma página offline customizada aqui se quisermos.
         console.log('Fetch falhou:', err);
         throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
