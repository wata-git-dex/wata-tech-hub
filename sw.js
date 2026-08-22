const VERSION = "wata-tech-hub-v2";
const APP_SHELL = [
  "/", "/index.html", "/styles.css?v=19", "/app.js?v=22", "/partner-branding.js", "/theme-init.js",
  "/manifest.webmanifest", "/assets/tech-hub/icon-32.png",
  "/assets/tech-hub/apple-touch-icon.png", "/assets/tech-hub/icon-192.png",
  "/assets/tech-hub/icon-512.png", "/assets/tech-hub/icon-512-maskable.png",
  "/assets/wata-logo.png", "/assets/topography.svg",
  "/assets/apps/watadex/icon-192.png", "/assets/apps/registry/icon-192.png",
  "/assets/apps/community/icon.png", "/assets/apps/impact-map/icon.svg",
  "/assets/apps/website/icon.svg", "/assets/apps/field-app/icon.png",
  "/assets/apps/mwater/icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
      event.respondWith(fetch(request).catch(() => new Response(
        JSON.stringify({ error: "Offline: live access settings are unavailable" }),
        { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
      )));
    }
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }
  event.respondWith(fetch(request).then(response => {
    const copy = response.clone();
    caches.open(VERSION).then(cache => cache.put(request, copy));
    return response;
  }).catch(() => caches.match(request)));
});
