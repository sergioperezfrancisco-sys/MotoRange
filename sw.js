const CACHE_NAME = "motorange-v7";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") {
    return;
  }

  const sameOrigin = self.location.origin === new URL(event.request.url).origin;
  if(!sameOrigin) {
    return;
  }

  const isNavigation = event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").indexOf("text/html") >= 0;
  event.respondWith(
    isNavigation
      ? fetch(event.request).then(response => {
          if(response && response.status === 200 && response.type === "basic"){
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", response.clone()));
          }
          return response;
        }).catch(() => caches.match("./index.html"))
      : caches.match(event.request).then(cachedResponse => cachedResponse || fetch(event.request).then(response => {
          if(response && response.status === 200 && response.type === "basic"){
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => caches.match("./index.html")))
  );
});
