// 휴대폰 웹앱용 서비스 워커: 앱 설치를 가능하게 하고, 인터넷이 끊겨도 화면이 열리게 해요.
// (크롬 확장 프로그램에서는 쓰이지 않아요)
const CACHE = "rangi-v36";
const FILES = ["generator.html", "app.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== "rangi-share").map((k) => caches.delete(k)))));
  self.clients.claim();
});

// 항상 최신 파일을 먼저 받고, 실패하면(오프라인) 저장해 둔 파일을 보여줘요
self.addEventListener("fetch", (e) => {
  const req = e.request;
  // 휴대폰에서 [공유 → 랑이 특가 자동화]로 사진(+글)이 들어오면: 사진은 잠깐 보관하고, 글은 주소에 담아 앱을 열어요
  if (req.method === "POST" && new URL(req.url).pathname.endsWith("/share-target")) {
    e.respondWith((async () => {
      const fd = await req.formData();
      const qs = new URLSearchParams();
      ["title", "text", "url"].forEach((k) => { const v = fd.get(k); if (v) qs.set(k, v); });
      const f = fd.getAll("photo").find((x) => x && x.size);
      if (f) {
        const c = await caches.open("rangi-share");
        await c.put("shared-photo", new Response(f, { headers: { "Content-Type": f.type || "image/jpeg" } }));
        qs.set("photo", "1");
      }
      return Response.redirect("generator.html?" + qs.toString(), 303);
    })());
    return;
  }
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // cache: "no-cache" → 브라우저가 들고 있던 예전 파일 말고 항상 서버에 새 버전이 있는지 확인해요
    fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
