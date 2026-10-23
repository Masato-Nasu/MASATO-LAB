import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/_middleware.js';
import {projectData,slugs,isSecret,token,authenticated,safeNext} from '../functions/_secret-room.js';
const fixture = JSON.parse(await readFile(new URL('./portfolio-fixture.json',import.meta.url)));
const secret = fixture.portfolio.filter(isSecret);
assert.equal(secret.length,17);
assert.equal(projectData(fixture).portfolio.length,28);
assert.equal(projectData(fixture,'secret').portfolio.length,17);
assert.equal(projectData(fixture,'editor').portfolio.length,45);
const html = await readFile(new URL('../portfolio.html',import.meta.url),'utf8');
const env = {SECRET_ROOM_PASSWORD:'test-only-secret-strong-password',SITE_DATA:{get: async k => k==='site-data'?JSON.stringify(fixture):null,put:async()=>{}},ASSETS:{fetch:async url=>{assert.equal(url.pathname,'/portfolio');return new Response(html,{headers:{'content-type':'text/html'}})}}};
const validToken = await token(env.SECRET_ROOM_PASSWORD);
const cookie = `__Host-masato-room=${validToken}`;
const req = (path,init={}) => new Request(`https://masato-lab.pages.dev${path}`,init);
assert(await authenticated(req('/',{headers:{cookie}}),env));
assert(!await authenticated(req('/',{headers:{cookie:cookie+'x'}}),env));
assert(!await authenticated(req('/',{headers:{cookie:`__Host-masato-room=${await token(env.SECRET_ROOM_PASSWORD,Date.now()-1)}`}}),env));
assert(!await authenticated(req('/',{headers:{cookie}}),{SECRET_ROOM_PASSWORD:'changed-password'}));
assert.equal(safeNext('//evil.example'),'/secret-room');
assert.equal(safeNext('/portfolio/abc'),'/portfolio/abc');
async function call(path,{auth=false,method='GET',body,origin}={}) {
 let nextCount=0;
 const headers = {...(auth?{cookie}:{}),...(origin?{origin}:{})};
 if(body) headers['content-type']='application/x-www-form-urlencoded';
 const response=await onRequest({env,request:req(path,{method,headers,body}),next:async()=>{
   nextCount++;
   if(path.startsWith('/api/data')||path==='/data.json')return new Response(JSON.stringify(fixture),{headers:{'content-type':'application/json'}});
   return new Response(html,{headers:{'content-type':'text/html'}});
 }});
 return {response,nextCount};
}
for (const path of ['/api/data','/data.json']) {
 const {response}=await call(path);const json=await response.json();
 assert.equal(json.portfolio.length,28);
 for(const item of secret)assert(!JSON.stringify(json).includes(item.image));
}
const originalSlugs=slugs(fixture.portfolio);
for(let i=0;i<fixture.portfolio.length;i++) {
 if(!isSecret(fixture.portfolio[i]))continue;
 const {response,nextCount}=await call('/portfolio/'+encodeURIComponent(originalSlugs[i]));
 assert.equal(response.status,303);assert.equal(nextCount,0);
 const imagePath=new URL(fixture.portfolio[i].image).pathname;
 for(const path of [imagePath,'/api/image?src='+encodeURIComponent(imagePath)]) {
  const {response,nextCount}=await call(path);assert.equal(response.status,401);assert.equal(nextCount,0);
  const allowed=await call(path,{auth:true});assert.equal(allowed.response.status,200);assert.match(allowed.response.headers.get('cache-control'),/no-store/);
 }
}
assert.equal((await call('/portfolio/%2568ypenyx-45')).response.status,400);
assert.equal((await call('/secret-room/data')).response.status,401);
assert.equal((await (await call('/secret-room/data',{auth:true})).response.json()).portfolio.length,17);
assert.equal((await call('/secret-room/editor-data',{auth:true})).response.status,403);
assert(!isSecret({title:'HYPENYX.45',secretRoom:false}));
assert(isSecret({title:'New work',secretRoom:true}));
assert(isSecret({title:'New title',...{secretRoom:true}}));
const gallery=await (await call('/secret-room',{auth:true})).response.text();
assert(gallery.includes("const candidates=['/secret-room/data']"));
assert(gallery.includes('>SECRET ROOM</h2>'));
assert(gallery.includes('LOG OUT'));
assert(!gallery.includes('id="secret-room-entry"'));
assert(gallery.includes('BACK TO PORTFOLIO'));
const editorHtml=await readFile(new URL('../editor/index.html',import.meta.url),'utf8');
assert(editorHtml.includes('id="portfolio-secretroom"'));
assert(editorHtml.includes("secretRoom: $('portfolio-secretroom').checked"));
assert(editorHtml.includes('🔒 SECRET ROOM'));
const collectSource=editorHtml.slice(editorHtml.indexOf('function collectPortfolio(){'),editorHtml.indexOf('function collectMemory(){'));
const fields=new Proxy({}, {get:(_,id)=>({value:id==='portfolio-title'?'Renamed work':'',checked:id==='portfolio-secretroom'})});
const saved=vm.runInNewContext(collectSource+';collectPortfolio()', {state:{selectedIndex:0,data:{portfolio:[{slug:'existing-slug',secretRoom:true,custom:'keep'}]}},$:(id)=>fields[id],parseTags:()=>[]});
assert.equal(saved.secretRoom,true);assert.equal(saved.slug,'existing-slug');assert.equal(saved.custom,'keep');assert.equal(saved.title,'Renamed work');
const editorLogin=(await call('/secret-room/login?next=%2Feditor%2F')).response;
assert.equal(editorLogin.status,303);assert.equal(editorLogin.headers.get('location'),'/editor/');

assert((await (await call('/portfolio')).response.text()).includes('id="secret-room-entry"'));
assert.equal((await call('/secret-room/login',{method:'POST',origin:'https://evil.example',body:'password=x'})).response.status,403);
assert.equal((await call('/secret-room/login',{method:'POST',origin:'https://masato-lab.pages.dev',body:'password=wrong'})).response.status,401);
const signedIn=await call('/secret-room/login',{method:'POST',origin:'https://masato-lab.pages.dev',body:'password='+env.SECRET_ROOM_PASSWORD});
assert.equal(signedIn.response.status,303);assert.match(signedIn.response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
assert.equal((await call('/editor/')).response.status,403);
assert.equal((await call('/api/save',{method:'POST',body:'x'})).response.status,403);
assert.equal((await call('/api/save',{auth:true,method:'POST',body:'x',origin:'https://evil.example'})).response.status,403);
console.log('PASS: 17 protected works; public API/data; every detail/image/proxy; stable links; login/session/expiry/CSRF; editor protection; gallery and entrance.');
