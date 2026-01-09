self.addEventListener('install', (event) => {
      event.waitUntil(
            caches.open('khata-cache-v1').then((cache) => {
                  return cache.addAll([
                        '/',
                        '/offline'
                  ]);
            })
      );
});

self.addEventListener('fetch', (event) => {
      event.respondWith(
            caches.match(event.request).then((response) => {
                  return response || fetch(event.request).catch(() =>
                        caches.match('/offline')
                  );
            })
      );
});
