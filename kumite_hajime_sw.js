// 空手試合補助アプリ「Hajime」 Service Worker
// 方式：キャッシュを先に返し、裏で最新版を取得してキャッシュを更新（次回起動時に反映）
// ファイルを差し替えて公開したときは VERSION を上げると、古いキャッシュを確実に削除できる
const VERSION = "v1";
const CACHE = "kumite-hajime-" + VERSION;
const FILES = [
  "./kumite_hajime.html",
  "./kumite_hajime.webmanifest",
  "./kumite_hajime_icon_180.png",
  "./kumite_hajime_icon_192.png",
  "./kumite_hajime_icon_512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("kumite-hajime-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then(res => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const res = await net;
      return res || cache.match("./kumite_hajime.html");
    })
  );
});
