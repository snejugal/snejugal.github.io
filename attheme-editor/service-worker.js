self.addEventListener("install", function(event) {
  event.waitUntil(caches.open("attheme-editor").then(function(cache) {
    return cache.addAll([
      "index.html",
      "default_values.js",
      "script.js",
      "style.css",
      "transparency.svg",
      "favicon.png",
      "/attheme-editor/"
    ]).then(function() {
      self.skipWaiting();
    })
  }));
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    if ("onLine" in navigator && navigator.onLine) {
      return fetch(event.request) || response;
    }
    return response || fetch(event.request);
  }));
});
