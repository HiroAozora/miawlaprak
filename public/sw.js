const CACHE_NAME = "miawlaprak-v1";

// Halaman yang di-cache saat install
const PRECACHE_URLS = ["/", "/manifest.json"];

// Install — precache asset utama
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network first, fallback ke cache
self.addEventListener("fetch", (event) => {
  // Abaikan request non-GET dan request ke Firebase/Google API
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firestore.googleapis.com")) return;
  if (event.request.url.includes("identitytoolkit.googleapis.com")) return;
  if (event.request.url.includes("securetoken.googleapis.com")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Simpan response ke cache (hanya untuk request same-origin)
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: coba ambil dari cache
        return caches.match(event.request).then((cached) => cached || caches.match("/"));
      })
  );
});
