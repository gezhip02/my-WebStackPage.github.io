const CACHE_NAME = 'webstack-cache-v1';
const STATIC_CACHE_NAME = 'webstack-static-v1';
const DYNAMIC_CACHE_NAME = 'webstack-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '../css/bootstrap.css',
  '../css/xenon-core.css',
  '../css/xenon-components.css',
  '../css/xenon-skins.css',
  '../css/nav.css',
  '../js/jquery-1.11.1.min.js',
  '../js/bootstrap.min.js',
  '../js/lozad.js',
  '../images/loading.gif',
  '../images/default.png'
];

// 需要缓存的动态资源（如API请求等）
const DYNAMIC_ASSETS = [
  '/api/',
  '.json'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // 缓存动态资源
      caches.open(DYNAMIC_CACHE_NAME)
    ])
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 处理资源请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 处理静态资源
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // 处理动态资源
  if (DYNAMIC_ASSETS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return fetch(event.request).then(fetchResponse => {
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => response);
      })
    );
    return;
  }
  
  // 处理其他资源
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
}); 