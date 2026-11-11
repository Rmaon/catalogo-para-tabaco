// Sube la versión al publicar cambios para que el iPad descargue los archivos nuevos
const CACHE = 'catalogo-cachimba-v4', FONT_CACHE = 'catalogo-fuentes';
const FILES = ['./', './index.html', './styles.css', './app.js', './seed.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

// Responde desde la caché (funciona sin conexión) y la actualiza en segundo plano
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Google Fonts: una vez descargadas, siempre desde la caché (no cambian)
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      const r = await fetch(e.request);
      if (r.ok || r.type === 'opaque') cache.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
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
