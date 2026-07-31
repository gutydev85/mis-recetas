const CACHE_NAME = 'mi-recetario-v6-' + '20250731';
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
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isAppFile = FILES_TO_CACHE.some(f => url.pathname.endsWith(f.replace('./', '/')) || url.pathname === '/');
  const isImage = e.request.destination === 'image';

  if (isAppFile && !isImage) {
    e.respondWith(
      fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request).then(cached => cached || new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

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
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        if (isImage) return new Response('', { status: 204 });
      });
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'getVersion') e.source.postMessage({ type: 'VERSION', version: CACHE_NAME });
});

self.addEventListener('waiting', e => {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE', version: CACHE_NAME }));
  });
});