const CACHE_NAME = 'mi-recetario-v5';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        FILES_TO_CACHE.map(url =>
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
  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response;
      return fetch(e.request).then(networkResponse => {
        // Cache successful GET requests for static assets
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Return a simple offline fallback for images
        if (e.request.destination === 'image') {
          return new Response('', { status: 204 });
        }
      });
    })
  );
});
