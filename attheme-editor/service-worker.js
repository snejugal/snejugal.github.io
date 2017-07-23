self.addEventListener("install", function(event) {
  event.waitUntil(caches.open("attheme-editor").then(function(cache) {
    return cache.addAll([
      "index.html",
      "js/color.js",
      "js/values.js",
      "js/script.js",
      "js/functions.js",
      "css/general.css",
      "css/welcome-screen.css",
      "css/workplace-screen.css",
      "css/dialogs.css",
      "img/transparency.svg",
      "img/dark-transparency.svg",
      "img/favicon.png",
      "/attheme-editor/",
      "img/download.svg",
      "img/light.svg",
      "img/dark.svg"
    ]).then(function() {
      self.skipWaiting();
    });
  }));
});

async function recache(request) {
  if (request.url.slice(0, 4) == "http") {
    setTimeout(function() {
      caches.open("attheme-editor").then(function(cache) {
        cache.delete(request).then(function() {
          cache.add(request.url);
        });
      });
    }, 1000);
  }
}

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    if (navigator.onLine) {
      recache(event.request);
      if (event.request.url.match(/\/variables-previews\//)) {
        return response;
      }
      return fetch(event.request) || response;
    }
    return response;
  }));
});
