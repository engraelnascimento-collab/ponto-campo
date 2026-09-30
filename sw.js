// Ponto de Campo — guarda o app no aparelho para abrir sem internet.
// Ao alterar o index.html, troque a versão abaixo (v1 -> v2) para os celulares atualizarem.
const VERSAO = 'ponto-v3';
const FONTES = VERSAO + '-fontes';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO && k !== FONTES).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    // Abre do aparelho na hora e atualiza em segundo plano quando houver internet
    e.respondWith(caches.open(VERSAO).then(async c => {
      const guardado = await c.match(e.request, {ignoreSearch: true});
      const rede = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
      return guardado || (await rede) || c.match('./index.html');
    }));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTES).then(async c => {
      const guardado = await c.match(e.request);
      if (guardado) return guardado;
      try { const r = await fetch(e.request); c.put(e.request, r.clone()); return r; }
      catch (err) { return Response.error(); }
    }));
  }
  // Chamadas à planilha (Apps Script) não passam pelo cache.
});
