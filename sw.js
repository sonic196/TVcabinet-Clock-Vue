const CACHE_NAME = 'clock-v12.1';
const ASSETS = [
    './',
    './index.html',
    './index_visual_test.html',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // 強制立即啟用新版 SW
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // 立即接管頁面
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
