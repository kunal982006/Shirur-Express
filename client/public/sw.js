// Shirur Express Service Worker - Enhanced for PWABuilder v3
const CACHE_VERSION = 'v3';
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
    console.log('[ServiceWorker] Install - version:', CACHE_VERSION);
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

    // Handle share target
    if (url.pathname === '/share') {
        event.respondWith(handleShareTarget(url));
        return;
    }

    // Handle file open
    if (url.pathname === '/open-file') {
        event.respondWith(handleFileOpen(request));
        return;
    }

    // Handle notes
    if (url.pathname === '/notes/new') {
        event.respondWith(handleNewNote(url));
        return;
    }

    // API calls - Network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Widget data
    if (url.pathname.startsWith('/api/widgets/')) {
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

// Handle share target requests
async function handleShareTarget(url) {
    const params = url.searchParams;
    const title = params.get('title') || '';
    const text = params.get('text') || '';
    const shareUrl = params.get('url') || '';

    // Redirect to main page with share data
    return Response.redirect(
        `/?shared=true&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        303
    );
}

// Handle file open requests (File Handlers API)
async function handleFileOpen(request) {
    console.log('[ServiceWorker] File open request received');

    // For file handler, redirect to home with file indicator
    // The actual file handling happens on the client side via launchQueue
    return Response.redirect('/?fileOpen=true', 303);
}

// Handle new note requests (Note-taking API)
async function handleNewNote(url) {
    console.log('[ServiceWorker] New note request received');

    // Redirect to a note-taking page or home
    return Response.redirect('/?newNote=true', 303);
}

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
        requireInteraction: false,
        silent: false,
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: 'Open', icon: '/icons/icon-72x72.png' },
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

// Background Sync - for offline operations
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync event:', event.tag);

    switch (event.tag) {
        case 'sync-orders':
            event.waitUntil(syncOrders());
            break;
        case 'sync-analytics':
            event.waitUntil(syncAnalytics());
            break;
        case 'sync-notes':
            event.waitUntil(syncNotes());
            break;
        case 'sync-favorites':
            event.waitUntil(syncFavorites());
            break;
        default:
            console.log('[ServiceWorker] Unknown sync tag:', event.tag);
    }
});

// Periodic Background Sync - for content updates
self.addEventListener('periodicsync', (event) => {
    console.log('[ServiceWorker] Periodic sync event:', event.tag);

    switch (event.tag) {
        case 'update-content':
            event.waitUntil(updateContent());
            break;
        case 'check-orders':
            event.waitUntil(checkOrderUpdates());
            break;
        case 'refresh-data':
            event.waitUntil(refreshAppData());
            break;
        default:
            console.log('[ServiceWorker] Unknown periodic sync tag:', event.tag);
    }
});

// Sync orders when back online
async function syncOrders() {
    console.log('[ServiceWorker] Syncing offline orders...');
    try {
        // Implementation for syncing offline orders
        // Would use IndexedDB to store pending orders
        console.log('[ServiceWorker] Orders synced successfully');
    } catch (error) {
        console.error('[ServiceWorker] Failed to sync orders:', error);
        throw error; // Retry sync
    }
}

// Sync analytics data
async function syncAnalytics() {
    console.log('[ServiceWorker] Syncing analytics...');
    // Analytics sync implementation
}

// Sync notes
async function syncNotes() {
    console.log('[ServiceWorker] Syncing notes...');
    // Notes sync implementation for note-taking feature
}

// Sync favorites
async function syncFavorites() {
    console.log('[ServiceWorker] Syncing favorites...');
    // Favorites sync implementation
}

// Update cached content periodically
async function updateContent() {
    console.log('[ServiceWorker] Updating cached content...');
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);

        // Update key pages
        const pagesToUpdate = ['/', '/restaurants', '/grocery', '/my-bookings'];
        for (const page of pagesToUpdate) {
            try {
                const response = await fetch(page, { cache: 'no-store' });
                if (response.ok) {
                    await cache.put(page, response);
                    console.log(`[ServiceWorker] Updated cache for ${page}`);
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
    try {
        // Check for order status updates and notify user
        const response = await fetch('/api/orders/pending-updates');
        if (response.ok) {
            const updates = await response.json();
            for (const update of updates) {
                await self.registration.showNotification('Order Update', {
                    body: update.message,
                    icon: '/icons/icon-192x192.png',
                    tag: `order-${update.orderId}`,
                    data: { url: `/order/${update.orderId}/track` }
                });
            }
        }
    } catch (error) {
        console.log('[ServiceWorker] Failed to check order updates:', error);
    }
}

// Refresh all app data
async function refreshAppData() {
    console.log('[ServiceWorker] Refreshing app data...');
    await updateContent();
}

// Message handler for client communication
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);

    if (!event.data) return;

    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            if (event.ports[0]) {
                event.ports[0].postMessage({ version: CACHE_VERSION });
            }
            break;

        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => caches.delete(cacheName))
                    );
                })
            );
            break;

        case 'CACHE_URLS':
            if (event.data.urls) {
                event.waitUntil(
                    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                        return cache.addAll(event.data.urls);
                    })
                );
            }
            break;

        case 'REGISTER_SYNC':
            if (event.data.tag && 'sync' in self.registration) {
                event.waitUntil(
                    self.registration.sync.register(event.data.tag)
                );
            }
            break;
    }
});

// Handle content indexing (if supported)
self.addEventListener('contentdelete', (event) => {
    console.log('[ServiceWorker] Content deleted:', event.id);
    // Handle content deletion from index
});

console.log('[ServiceWorker] Service Worker loaded - version:', CACHE_VERSION);
