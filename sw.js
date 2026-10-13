// Formwerk Service Worker: macht die App offline nutzbar.
// Bei einem Update der App diese Versionsnummer erhöhen.
const VERSION = "formwerk-v2";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
const CDN = [
  "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // Scanner-Bibliothek gleich mitladen, damit der Scanner auch offline geht
    await Promise.all(CDN.map(u => fetch(u, { mode: "no-cors" }).then(r => cache.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Produktdatenbank immer live abfragen, nie zwischenspeichern
  if (url.hostname.endsWith("openfoodfacts.org")) return;

  // App-Seite: zuerst online (für Updates), sonst aus dem Speicher
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put("./index.html", res.clone());
        return res;
      } catch (e) {
        return (await caches.match("./index.html")) || (await caches.match("./"));
      }
    })());
    return;
  }

  // Alles andere (Icons, Schriften, Scanner): aus dem Speicher, im Hintergrund aktualisieren
  const cacheable = url.origin === self.location.origin ||
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  if (!cacheable) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req);
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await net) || new Response("", { status: 504 });
  })());
});
