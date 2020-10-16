console.log("This is the service worker");

const FILES_TO_CACHE = [
    "/index.html",
    "/style.css",
    "/index.js",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cacheObj => {
            console.log("Cached successfully!");
            return cacheObj.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old key", key);
                        return caches.delete(key);
                    }
                })
            )
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    if (event.request.url.include("/api/")) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }

                    return response;
                })
                .catch(error => {
                    return cache.match(event.request.url);
                });
            }).catch(error => console.log(error))
        )
        return;
    }

    event.respondWith(
        caches.match(event.request.url)
        .then(response => {
            return response || fetch(event.request);
        })
    )
});