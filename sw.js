const CACHE_NAME = "memorias-v3";
const ASSETS = ["index.html", "style.css", "app.js", "bienvenida.js", "manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // No cachear llamadas a la API de Apps Script (siempre red)
  if (e.request.url.includes("script.google.com")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
