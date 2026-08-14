const CACHE_NAME = "echo-ultrasound-20260814-v4";
const CORE_FILES = [
  "/",
  "/archive-data.json",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    const response = await fetch("/archive-data.json");
    const data = await response.json();
    const localImages = Object.values(data.imageManifest || {});
    await cache.addAll(localImages);
    const page = await fetch("/", { cache: "reload" });
    const html = await page.text();
    const assets = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
      .map((match) => match[1])
      .filter((path) => path.startsWith("/") && !path.startsWith("//"));
    await cache.addAll(Array.from(new Set(assets)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (event.request.mode === "navigate") {
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put("/", response.clone());
        return response;
      } catch (error) {
        return cache.match("/");
      }
    }
    const cached = await cache.match(event.request, { ignoreSearch: event.request.mode === "navigate" });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === "navigate") return cache.match("/");
      throw error;
    }
  })());
});
