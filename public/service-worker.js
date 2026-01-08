// This service worker will be populated by next-pwa build/runtime.
// We add a small runtime message handler as a convenience for debugging.
self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
      }
});

// Fallback response (for offline fallback page)
self.addEventListener('fetch', (event) => {
      // let next-pwa handle normal routing and caching; keep fallback for HTML navigations
});