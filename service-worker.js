const CACHE = "pdv-cache-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS);
    })
  );

  self.skipWaiting();

});

self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE)
        .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();

});

self.addEventListener("fetch", event => {

  if (!event.request.url.startsWith("http")) return;

  event.respondWith(

    caches.match(event.request).then(response => {

      if(response){
        return response;
      }

      return fetch(event.request).then(networkResponse => {

        return caches.open(CACHE).then(cache => {

          cache.put(event.request, networkResponse.clone());
          return networkResponse;

        });

      });

    })

  );

});
