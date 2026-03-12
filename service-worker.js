const CACHE = "delicias-pdv-cache-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );

  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {

  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {

      if (cached) return cached;

      return fetch(event.request).then((response) => {

        const clone = response.clone();

        caches.open(CACHE).then((cache) => {
          cache.put(event.request, clone);
        });

        return response;

      }).catch(() => caches.match("/index.html"));

    })
  );
});
