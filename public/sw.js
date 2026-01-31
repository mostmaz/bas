const CACHE_NAME = 'bascavarat-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Try to cache all, but don't fail if one fails (optional, but safer to match exact files)
                // Since we removed index.css (hashed), this should work for static files.
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Network First for HTML (Navigation)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First for Assets (JS, CSS, Images in /assets)
    // Vite hashes are immutable, so we can cache them aggressively if we could track them.
    // For now, Stale-While-Revalidate is safer if we don't know exact filenames.
    // Or just Network First for everything to solve the "Losing Cache/Updates" issue reliably.

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
