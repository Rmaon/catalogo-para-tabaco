// Sube la versión al publicar cambios para que el iPad descargue los archivos nuevos
const CACHE = 'catalogo-cachimba-v2';
const FILES = ['./', './index.html', './styles.css', './app.js', './seed.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

// Responde desde la caché (funciona sin conexión) y la actualiza en segundo plano
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => cached || cache.match('./index.html'));
    if (cached) { e.waitUntil(network); return cached; }
    return network;
  }));
});
