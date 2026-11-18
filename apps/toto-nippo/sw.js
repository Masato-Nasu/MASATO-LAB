const BASE=new URL('./',self.location.href);
const PREFIX='toto-nippo:'+BASE.pathname+':';
const CACHE=PREFIX+'v0.3.0';
const ASSETS=['./','index.html','style.css','app.js?v=0.3.0','core.mjs','store.mjs','jpeg.mjs','sample.json','pwa.js','manifest.webmanifest','icon-192.png','icon-512.png'].map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// Updates activate after existing app windows close; never reload unsaved work.
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Only the static application shell is cached. API calls and other site paths bypass this worker.
 if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 if(request.mode==='navigate'){
  if(url.pathname!==BASE.pathname&&url.pathname!==new URL('index.html',BASE).pathname)return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('./',BASE).href))||fetch(request)));return;
 }
 if(!ASSETS.includes(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
