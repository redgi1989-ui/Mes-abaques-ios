const V='abaques-v3';
const CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','noms.json'];
// Installation : récupère des copies toutes fraîches (sans passer par le cache du navigateur).
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const estPage=u=>u.origin===location.origin&&(u.pathname.endsWith('/')||u.pathname.endsWith('index.html'));
const signature=r=>r&&(r.headers.get('etag')||r.headers.get('last-modified')||r.headers.get('content-length'));
// Ouverture immédiate depuis la mémoire ; la nouvelle version est vérifiée en arrière-plan (sans cache du navigateur) pour la fois suivante.
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 e.respondWith((async()=>{
  const c=await caches.open(V);
  let m=await c.match(r);
  if(!m&&r.mode==='navigate')m=await c.match('index.html');
  const maj=(u.origin===location.origin?fetch(u.href,{cache:'no-cache'}):fetch(r)).then(async x=>{
   if(x&&(x.ok||x.type==='opaque')){
    const avant=m&&estPage(u)?signature(m):null;
    await c.put(r,x.clone());
    if(avant&&signature(x)&&avant!==signature(x)){
     const cl=await self.clients.matchAll();cl.forEach(k=>k.postMessage('maj'));
    }
   }
   return x;
  }).catch(()=>null);
  if(m){e.waitUntil(maj);return m}
  const x=await maj;
  return x||Response.error();
 })());
});
