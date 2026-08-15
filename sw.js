const CACHE_NAME = 'senderos-pnlq-v19';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './responsive.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/icons-d-e/d01-vegetacion-invasora.webp',
  './assets/icons-d-e/d02-arbol-caido.webp',
  './assets/icons-d-e/d03-raices-piedras.webp',
  './assets/icons-d-e/d04-huella-erosionada.webp',
  './assets/icons-d-e/d05-carcavas.webp',
  './assets/icons-d-e/d06-drenaje-obstruido.webp',
  './assets/icons-d-e/d07-talud-inestable.webp',
  './assets/icons-d-e/d08-estructura-danada.webp',
  './assets/icons-d-e/d09-senalizacion.webp',
  './assets/icons-d-e/d10-basura-vandalismo.webp',
  './assets/icons-d-e/d11-musgo-liquenes.webp',
  './assets/icons-d-e/d12-atajos.webp',
  './assets/icons-d-e/d13-riesgo-biologico.webp',
  './assets/icons-d-e/d14-dano-climatico.webp',
  './assets/icons-d-e/d15-otro.webp',
  './assets/icons-d-e/e01-roza-lateral.webp',
  './assets/icons-d-e/e02-poda-selectiva.webp',
  './assets/icons-d-e/e03-retiro-caidos.webp',
  './assets/icons-d-e/e04-retiro-riesgosos.webp',
  './assets/icons-d-e/e05-retiro-obstaculos.webp',
  './assets/icons-d-e/e06-residuos.webp',
  './assets/icons-d-e/e07-limpieza-areas.webp',
  './assets/icons-d-e/e08-otro-e1.webp',
  './assets/icons-d-e/e09-limpieza-drenajes.webp',
  './assets/icons-d-e/e10-reconformar-huella.webp',
  './assets/icons-d-e/e11-retiro-sedimentos.webp',
  './assets/icons-d-e/e12-pendiente-transversal.webp',
  './assets/icons-d-e/e13-drenaje-superficial.webp',
  './assets/icons-d-e/e14-material-estabilizante.webp',
  './assets/icons-d-e/e15-cierre-atajo.webp',
  './assets/icons-d-e/e16-otro-e2.webp',
  './assets/icons-d-e/e17-reparar-escalon.webp',
  './assets/icons-d-e/e18-reparar-baranda.webp',
  './assets/icons-d-e/e19-reparar-puente.webp',
  './assets/icons-d-e/e20-senal-temporal.webp',
  './assets/icons-d-e/e21-limpieza-rotulo.webp',
  './assets/icons-d-e/e22-aviso-preventivo.webp',
  './assets/icons-d-e/e23-cierre-inseguro.webp',
  './assets/icons-d-e/e24-otro-e3.webp',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/jszip.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
