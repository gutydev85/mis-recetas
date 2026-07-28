const CACHE_NAME = 'mi-recetario-v5.2';
const FILES_TO_CACHE = [
 './','./index.html','./styles.css','./app.js','./manifest.json',
 './icon-180.png','./icon-192.png','./icon-512.png'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', e => {
 e.waitUntil(
 caches.open(CACHE_NAME).then(c => c.addAll(FILES_TO_CACHE))
 );
 self.skipWaiting();
});

// Activar: limpiar cachés viejas y tomar control inmediato
self.addEventListener('activate', e => {
 e.waitUntil(
 caches.keys().then(keys =>
 Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
 )
 );
 self.clients.claim();
});

// Fetch: stale-while-revalidate
self.addEventListener('fetch', e => {
 e.respondWith(
 caches.match(e.request).then(cached => {
 const fetchPromise = fetch(e.request).then(networkResponse => {
 if (networkResponse && networkResponse.ok) {
 const clone = networkResponse.clone();
 caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
 }
 return networkResponse;
 }).catch(() => cached);
 return cached || fetchPromise;
 })
 );
});
