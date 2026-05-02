const CACHE_NAME = "mantra-v1";
const STATIC_ASSETS = [
  "/",
  "/app",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls, WS, or SSE streams
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/ws/") ||
    request.headers.get("accept")?.includes("text/event-stream")
  ) {
    return;
  }

  // Network-first for HTML navigation
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/app") ?? caches.match("/"))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ?? fetch(request).then((response) => {
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
    )
  );
});
