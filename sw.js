// const cacheName = "pwa-demo3";
// self.addEventListener("install", (e) => {
//   e.waitUntil(
//     caches
//       .open(cacheName)
//       //缓存的文件集合
//       .then((cache) => cache.addAll(["index.html", "index.js", "style.css"]))
//   );
// });
// //动态缓存处理
// self.addEventListener("fetch", (e) => {
//   console.log(e.request.url);
//   // e.respondWith(
//   //   caches.match(e.request).then((response) => response || fetch(e.request))
//   // );
//   e.respondWith(networkFirst(e.request));
// });
// // Service Worker 启动事件，处理更新缓存
// // self.addEventListener("activate", function (e) {
// //   e.waitUntil(
// //     Promise.all(
// //       caches.keys().then((keyList) => {
// //         return keyList.map((key) => {
// //           // 遍历已有缓存，保留与当前一样的缓存，即更新
// //           if (key !== cacheName) {
// //             return caches.delete(key);
// //           }
// //         });
// //       })
// //     ).then(() => {
// //       return self.clients.claim();
// //     })
// //   );
// // });

// // 网络优先
// async function networkFirst(req) {
//   try {
//     // 先从网络获取最新资源
//     // 请求可能失败，放在try中
//     // 有网络的情况下，请求成功，使用请求的数据
//     const fresh = await fetch(req);
//     return fresh;
//   } catch (e) {
//     // 没网络的情况下，请求失败，使用缓存的数据
//     const cache = await caches.open(cacheName);
//     // 在缓存中匹配req对应的结果
//     const cached = await cache.match(req);
//     console.log(cached);
//     return cached;
//   }
// }
//注册,主要缓存内容
// const CACHE_NAME = "cache_3"; //定义存储缓存的名字--类似数据库
// const CACHE_URL = ["/", "/icon/icon.png", "/manifest.json", "/index.css"];
// self.addEventListener("install", async (event) => {
//   //开启cache缓存，类似连接数据库
//   const cache = await caches.open(CACHE_NAME);
//   //cache 添加需要缓存的资源,使用await 等待把所有缓存存起来再进行
//   await cache.addAll(CACHE_URL);
//   //跳过等待直接进入activate
//   await self.skipWaiting();
// });
// //激活，主要清除缓存
// self.addEventListener("activate", async (event) => {
//   //获取到左右资源的key
//   const keys = await caches.keys();
//   keys.forEach((key) => {
//     if (key != CACHE_NAME) {
//       //旧资源
//       caches.delete(key);
//     }
//   });
//   //service worker 激活后，立即获取控制权
//   await self.clients.claim();
// });
// //监听请求，判断资源是否能够请求成功，成功则取相应结果，断网则取缓存内容
// self.addEventListener("fetch", async (event) => {
//   //请求对象
//   const req = event.request;
//   //只缓存同源内容
//   const url = new URL(req.url);
//   if (url.origin !== location.origin) {
//     return;
//   }
//   //给浏览器相应,
//   if (req.url.includes("/api")) {
//     //资源走网络优先
//     event.respondWith(networkFirst(req));
//   } else {
//     //资源走缓存优先
//     event.respondWith(cacheFrist(req));
//   }
// });

// //网络优先
// async function networkFirst(req) {
//   //取缓存中读取
//   const cache = await caches.open(CACHE_NAME);
//   //先从网络获取资源
//   try {
//     const fresh = await fetch(req);
//     //获取到的数据应该再次更新到缓存当中，把响应的备份存到缓存当中
//     cache.put(req, fresh.clone());
//     return fresh;
//   } catch (e) {
//     //匹配与req对应的资源
//     const cached = await cache.match(req);
//     return cached;
//   }
// }

// //缓存优先
// async function cacheFrist(req) {
//   //打开缓存
//   const cache = await caches.open(CACHE_NAME);
//   //取出对应数据
//   const cached = await cache.match(req);
//   if (cached) {
//     //如果从缓存中得到了，直接返回缓存
//     return cached;
//   } else {
//     const fresh = await fetch(req);
//     return fresh;
//   }
// }
const version = "offline-cache-v1";

// Serverice Worker 安装成功后触发该事件
self.addEventListener("install", function (event) {
  // sw.js 有更新，立即生效
  event.waitUntil(self.skipWaiting());
});

// sw.js 有更新时触发该事件
self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      // 更新客户端
      self.clients.claim(),

      // 删除旧版本的缓存对象
      caches.keys().then(function (cacheList) {
        return Promise.all(
          cacheList.map(function (cacheName) {
            if (cacheName !== version) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

// 网页发送请求触发该事件
self.addEventListener("fetch", function (event) {
  console.log("url is", event.request.url);

  event.respondWith(
    caches.match(event.request).then(function (response) {
      // 如果 Service Worker 有自己的返回，就直接返回，减少一次 http 请求
      if (response) {
        return response;
      }

      // 如果 service worker 没有返回，那就得直接请求真实远程服务
      var request = event.request.clone(); // 把原始请求拷过来
      return fetch(request).then(function (httpRes) {
        // 请求失败了，直接返回失败的结果就好了。。
        if (!httpRes || httpRes.status !== 200) {
          return httpRes;
        }

        // 请求成功的话，将请求缓存起来。
        var responseClone = httpRes.clone();
        caches.open(version).then(function (cache) {
          cache.put(event.request, responseClone);
        });

        return httpRes;
      });
    })
  );
});
