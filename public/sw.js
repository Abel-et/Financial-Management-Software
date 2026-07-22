const CACHE_NAME = "cattlehaven-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/index.css",
  "/src/App.tsx"
];

// 1. Install event: Cache core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching core shell assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[Service Worker] Initial caching skipped some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate event: Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Stale-While-Revalidate for app shell and assets, Network-Only for APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass API calls so the frontend can catch failures and use IndexedDB
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Handle static assets and navigation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if it exists, but trigger a background fetch to update the cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is completely down, do nothing, the cached response will cover it
        });

      return cachedResponse || fetchPromise;
    })
  );
});
