/* Yam's Gaillon — service worker (installation + hors connexion) */
const VERSION = "yams-v3";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
// Fichiers externes gardés en cache pour jouer sans réseau
const CDN = ["https://www.gstatic.com/firebasejs/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
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

  // Page : réseau d'abord (dernière version), copie de secours si hors connexion
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); event.waitUntil(caches.open(VERSION).then(c => c.put("./index.html", copy))); }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Fichiers de l'appli, SDK Firebase et polices
  if (url.origin === self.location.origin || CDN.some(p => req.url.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(event, req));
  }
  // Le reste (base Firestore, Analytics) passe directement par le réseau
});
