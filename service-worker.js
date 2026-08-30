// ============================================
// Service Worker — TecniSync Pro
// ============================================
// Guarda en caché los archivos de la app (HTML, CSS, JS, íconos)
// para que cargue rápido. Los datos reales (Supabase) siempre
// se piden por internet, nunca se guardan aquí.

const NOMBRE_CACHE = 'tecnisync-v1';

const ARCHIVOS_APP = [
  './index.html',
  './admin.html',
  './vendedor.html',
  './tecnico.html',
  './css/style.css',
  './js/supabaseClient.js',
  './js/login.js',
  './js/admin.js',
  './js/vendedor.js',
  './js/tecnico.js',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './manifest.json'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ARCHIVOS_APP))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== NOMBRE_CACHE)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  // Solo interceptamos peticiones a nuestro propio dominio (el sitio en sí).
  // Todo lo de Supabase (datos, login, fotos) siempre va directo a internet.
  if (url.origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      return respuestaCache || fetch(evento.request);
    })
  );
});
