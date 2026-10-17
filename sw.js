// Formwerk Service Worker: macht die App offline nutzbar.
// Bei einem Update der App diese Versionsnummer erhöhen.
const VERSION = "formwerk-v18";
const SHELL = [
  "./",
  "./index.html",
  "./guide.js",
  "./ai.js",
  "./brief.js",
  "./run.js",
  "./week.js",
  "./reminders.js",
  "./datenschutz.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
const CDN = [
  "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // cache: "reload" umgeht den Browser-Cache, damit nie eine alte Datei in die neue Version rutscht
    await Promise.all(SHELL.map(u => fetch(new Request(u, { cache: "reload" })).then(r => { if (r.ok) return cache.put(u, r); }).catch(() => {})));
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

async function networkFirst(req, key) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res && res.ok) cache.put(key || req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(key || req, { ignoreSearch: true })) || (await caches.match(key || req, { ignoreSearch: true })) || new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Produktdatenbank, KI und Strava immer live, nie zwischenspeichern
  if (url.hostname.endsWith("openfoodfacts.org") || url.hostname.endsWith("googleapis.com") && url.hostname !== "fonts.googleapis.com" || url.hostname.endsWith("anthropic.com") || url.hostname.endsWith("strava.com")) return;

  // App-Seite und eigene Skripte: immer zuerst online (damit alle Teile zusammenpassen), sonst aus dem Speicher
  if (req.mode === "navigate") {
    const page = /\/[^\/]+\.html$/.test(url.pathname) && !url.pathname.endsWith("/index.html") ? "." + url.pathname.slice(url.pathname.lastIndexOf("/")) : "./index.html";
    event.respondWith(networkFirst(req, page)); return;
  }
  if (url.origin === self.location.origin && /\.(js|json|webmanifest)$/.test(url.pathname)) {
    event.respondWith(networkFirst(req, "." + url.pathname.slice(url.pathname.lastIndexOf("/"))));
    return;
  }

  // Bilder, Icons, Schriften, Bibliotheken: aus dem Speicher, im Hintergrund aktualisieren
  const cacheable = url.origin === self.location.origin ||
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "www.gstatic.com" ||
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

// Tipp auf eine Erinnerung: App öffnen bzw. nach vorne holen, passenden Bereich zeigen
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const go = (event.notification.data && event.notification.data.go) || "heute";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { try { await c.navigate("./#" + go); } catch (e) {} return c.focus(); } }
    return self.clients.openWindow("./#" + go);
  })());
});
