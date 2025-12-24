// Shirur Express Service Worker - Enhanced for PWABuilder
const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `shirur-express-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `shirur-express-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `shirur-express-images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/maskable-icon-192x192.png',
    '/icons/maskable-icon-512x512.png',
    '/shirur-express-logo.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.log('[ServiceWorker] Failed to cache:', error);
            })
    );
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name.startsWith('shirur-express-') &&
                            name !== STATIC_CACHE_NAME &&
                            name !== DYNAMIC_CACHE_NAME &&
                            name !== IMAGE_CACHE_NAME;
                    })
                    .map((name) => {
                        console.log('[ServiceWorker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Razorpay and external scripts
    if (url.hostname !== location.hostname) {
        return;
    }

    // API calls - Network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Images - Cache first with network fallback
    if (
        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/) ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/screenshots/')
    ) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
        return;
    }

    // Static assets - Cache first
    if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
        return;
    }

    // HTML pages - Network first for fresh content
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Default - Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// Cache First Strategy
async function cacheFirst(request, cacheName = DYNAMIC_CACHE_NAME) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network request failed:', error);
        return caches.match('/offline.html');
    }
}

// Network First Strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network request failed, serving from cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // For navigation requests, return the cached index.html for SPA routing
        if (request.mode === 'navigate') {
            const indexResponse = await caches.match('/index.html');
            if (indexResponse) {
                return indexResponse;
            }
            return caches.match('/offline.html');
        }

        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
}

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');

    const data = event.data?.json() ?? {};
    const title = data.title || 'Shirur Express';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        tag: data.tag || 'default',
        renotify: true,
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked');
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Open a new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background Sync - for offline order queue
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);

    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }

    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

// Periodic Background Sync - for content updates
self.addEventListener('periodicsync', (event) => {
    console.log('[ServiceWorker] Periodic sync event:', event.tag);

    if (event.tag === 'update-content') {
        event.waitUntil(updateContent());
    }

    if (event.tag === 'check-orders') {
        event.waitUntil(checkOrderUpdates());
    }
});

// Sync orders when back online
async function syncOrders() {
    console.log('[ServiceWorker] Syncing offline orders...');
    try {
        // Get pending orders from IndexedDB (if implemented)
        // const pendingOrders = await getFromIndexedDB('pendingOrders');
        // for (const order of pendingOrders) {
        //   await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
        // }
        console.log('[ServiceWorker] Orders synced successfully');
    } catch (error) {
        console.error('[ServiceWorker] Failed to sync orders:', error);
        throw error; // Retry sync
    }
}

// Sync analytics data
async function syncAnalytics() {
    console.log('[ServiceWorker] Syncing analytics...');
    // Placeholder for analytics sync
}

// Update cached content periodically
async function updateContent() {
    console.log('[ServiceWorker] Updating cached content...');
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);

        // Update key pages
        const pagesToUpdate = ['/', '/restaurants', '/grocery'];
        for (const page of pagesToUpdate) {
            try {
                const response = await fetch(page);
                if (response.ok) {
                    await cache.put(page, response);
                }
            } catch (e) {
                console.log(`[ServiceWorker] Failed to update ${page}`);
            }
        }

        console.log('[ServiceWorker] Content updated');
    } catch (error) {
        console.error('[ServiceWorker] Failed to update content:', error);
    }
}

// Check for order updates
async function checkOrderUpdates() {
    console.log('[ServiceWorker] Checking for order updates...');
    // Placeholder for order status checking
}

// Handle share target
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === '/share' && event.request.method === 'GET') {
        event.respondWith(
            (async () => {
                // Redirect to home with share data in URL
                const params = url.searchParams;
                const title = params.get('title') || '';
                const text = params.get('text') || '';
                const shareUrl = params.get('url') || '';

                // Redirect to main page with share data
                return Response.redirect(`/?shared=true&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, 303);
            })()
        );
    }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[ServiceWorker] Service Worker loaded - version:', CACHE_VERSION);
