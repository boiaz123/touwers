const CACHE_NAME = 'touwers-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/js/game.js',
    '/js/StartScreen.js',
    '/js/Level.js',
    '/js/GameStateManager.js',
    '/js/GameState.js',
    '/js/LevelSelect.js', // If present
    '/js/towers/TowerManager.js',
    '/js/enemies/EnemyManager.js',
    '/js/enemies/BasicEnemy.js',
    '/js/buildings/SuperWeaponLab.js'
    // Add additional assets if new files are added; the worker will ignore 404 entries gracefully
];

// Install: cache core app shell
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('Some assets could not be cached during install', err);
            }))
    );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Fetch: try cache first, fallback to network, fallback to a cached fallback page
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request).then(networkResponse => {
                // Put a copy in the cache for future requests (best-effort)
                if (networkResponse && networkResponse.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                        try {
                            cache.put(event.request, networkResponse.clone());
                        } catch (e) {
                            // Sometimes opaque responses (cross-origin) can't be cached
                        }
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If response fails (offline), try to serve root or matching index.
                return caches.match('/index.html');
            });
        })
    );
});
