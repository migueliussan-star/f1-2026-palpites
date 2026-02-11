
const CACHE_NAME = 'f1-2026-v6-pwa';

// Instalação: Cache dos arquivos essenciais
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })