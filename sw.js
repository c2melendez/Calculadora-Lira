// Service Worker de la Calculadora Lira
// Estrategia: cache-first con actualización en segundo plano (stale-while-revalidate)
// Todo el cálculo ocurre en el cliente (no hay llamadas a servidor), así que una
// vez cacheada la app funciona 100% sin conexión.

const CACHE_NAME = 'lira-cache-v1';
const APP_SHELL = [
    './',
    './Calculadora_de_Lira.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Solo interceptamos peticiones GET del mismo origen
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse); // sin red: usa lo cacheado

            // Responde rápido con caché si existe; si no, espera la red
            return cachedResponse || networkFetch;
        })
    );
});
