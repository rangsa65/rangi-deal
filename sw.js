// 휴대폰 웹앱용 서비스 워커: 앱 설치를 가능하게 하고, 인터넷이 끊겨도 화면이 열리게 해요.
// (크롬 확장 프로그램에서는 쓰이지 않아요)
const CACHE = "rangi-v5";
const FILES = ["generator.html", "app.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// 항상 최신 파일을 먼저 받고, 실패하면(오프라인) 저장해 둔 파일을 보여줘요
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
