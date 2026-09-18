// Minimal service worker: exists mainly so the browser considers this app
// "installable." It only ever touches same-origin GET requests (the app's
// own files) and always tries the network first, only falling back to a
// cached copy if offline — so it never serves stale data, and it never
// intercepts requests to Supabase (a different origin) at all.

const CACHE_NAME = 'gos-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase or anything cross-origin
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
