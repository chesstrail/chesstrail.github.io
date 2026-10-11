// Funciona sem internet: guarda o site inteiro no aparelho na primeira visita.
// Código e dados: busca a versão nova na rede e cai no que está guardado se não houver
// conexão. Peças, motor e fontes: usa o guardado direto (não mudam).
const CACHE = "trilha-v1";
const ARQUIVOS = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/app.js", "js/board.js", "js/engine.js", "js/lessons.js", "js/linha.js", "js/progress.js", "js/puzzle.js", "js/revisao.js", "js/rules.js",
  "data/puzzles.json", "vendor/chess.js", "vendor/stockfish/stockfish-19-lite-single.js", "vendor/stockfish/stockfish-19-lite-single.wasm",
  "assets/icon-192.png", "assets/icon-512.png",
  ...["K", "Q", "R", "B", "N", "P"].flatMap((p) => [`assets/pieces/w${p}.svg`, `assets/pieces/b${p}.svg`]),
];
const FIXOS = /\/(vendor|assets)\/|fonts\.(googleapis|gstatic)\.com/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function daRede(req) {
  const c = await caches.open(CACHE);
  try {
    const r = await fetch(req);
    if (r.ok || r.type === "opaque") c.put(req, r.clone());
    return r;
  } catch (err) {
    const guardado = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" && await c.match("index.html"));
    if (guardado) return guardado;
    throw err;
  }
}
async function doCache(req) {
  const c = await caches.open(CACHE);
  const guardado = await c.match(req, { ignoreSearch: true });
  if (guardado) return guardado;
  const r = await fetch(req);
  if (r.ok || r.type === "opaque") c.put(req, r.clone());
  return r;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const nossa = url.origin === location.origin;
  if (!nossa && !FIXOS.test(req.url)) return; // links externos (Lichess etc.) seguem normais
  e.respondWith(FIXOS.test(url.pathname) || !nossa ? doCache(req) : daRede(req));
});
