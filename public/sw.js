// __CACHE_VERSION__ is replaced at build time by the swVersion Vite plugin
// with the current commit SHA (or a timestamp fallback). Each new deploy
// gets a unique CACHE_NAME, so the activate handler below evicts every
// older cache and stops serving stale assets.
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `goldsainte-${CACHE_VERSION}`;
const urlsToCache = ['/', '/marketplace', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});