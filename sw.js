const CACHE_NAME = 'mi-recetario-v5';
const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './js/core.js',
  './js/features.js',
  './js/main.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        APP_FILES.map(url =>
          cache.add(url).catch(err => {
            console.warn('SW: failed to cache', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Detectar archivos de la app (HTML, JS, CSS, manifest)
  const isAppFile = APP_FILES.some(f => {
    const path = f.replace('./', '/');
    return url.pathname === path || (f === './' && url.pathname === '/');
  });

  // Para archivos de la app: network-first (siempre intentar red primero)
  if (isAppFile) {
    e.respondWith(
      fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request).then(cached => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Para imágenes y otros recursos: cache-first
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response;
      return fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        if (e.request.destination === 'image') {
          return new Response('', { status: 204 });
        }
      });
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
