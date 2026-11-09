/* Yam's Gaillon — service worker (installation + hors connexion) */
const VERSION = "yams-v19";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./qrcode.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
// Fichiers externes gardés en cache pour jouer sans réseau
const CDN = ["https://www.gstatic.com/firebasejs/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", event => {
  // pas de skipWaiting ici : la nouvelle version attend qu'on touche « Mettre à jour »
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache d'abord, mis à jour en arrière-plan
function staleWhileRevalidate(event, request) {
  return caches.open(VERSION).then(cache =>
    cache.match(request).then(hit => {
      const network = fetch(request).then(res => {
        if (res.ok || res.type === "opaque") cache.put(request, res.clone());
        return res;
      });
      if (hit) { event.waitUntil(network.catch(() => {})); return hit; }
      return network;
    })
  );
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Page : toujours la version installée ; la nouvelle n'arrive qu'en touchant « Mettre à jour »
  if (req.mode === "navigate") {
    event.respondWith(
      caches.open(VERSION).then(c => c.match("./index.html")).then(hit => hit || fetch(req))
    );
    return;
  }

  // Fichiers de l'appli : ceux de la version installée
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }

  // SDK Firebase et polices
  if (CDN.some(p => req.url.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(event, req));
  }
  // Le reste (base Firestore, Analytics) passe directement par le réseau
});
