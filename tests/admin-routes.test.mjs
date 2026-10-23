import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {onRequest} from '../functions/_middleware.js';
import {token,isSecret,projectData} from '../functions/_secret-room.js';
import * as save from '../functions/api/save.js';
import * as upload from '../functions/api/upload.js';
import * as editorSave from '../functions/editor/save.js';
import * as editorUpload from '../functions/editor/upload.js';
import * as editorAssets from '../functions/editor/assets.js';
import * as editorData from '../functions/editor/data.js';
import {accessFixture} from './access-fixture.mjs';
const access=await accessFixture();
after(()=>access.restore());
const fixture=JSON.parse(await readFile(new URL('./portfolio-fixture.json',import.meta.url)));
const page=await readFile(new URL('../portfolio.html',import.meta.url),'utf8');
const origin='https://masato-lab.pages.dev';
let kvWrites=[],r2Writes=[];
let current={...fixture,site:{...fixture.site,profileImage:'/media/existing-photo.png'}};
const env={SECRET_ROOM_PASSWORD:'test-viewer-password-123456',
  SITE_DATA:{get:async key=>key==='site-data'?JSON.stringify(current):null,put:async(key,value)=>{kvWrites.push({key,value});}},
  MEDIA:{put:async(key,body,options)=>{r2Writes.push({key,options});}},
  R2_PUBLIC_BASE_URL:'https://assets.example.test',
  ASSETS:{fetch:async()=>new Response(page,{headers:{'content-type':'text/html'}})}
};
const cookie=`__Host-masato-room=${await token(env.SECRET_ROOM_PASSWORD)}`;
const assertion=await access.sign();
const routes={'/api/save':save,'/api/upload':upload,'/editor/save':editorSave,'/editor/upload':editorUpload,'/editor/assets':editorAssets,'/editor/data':editorData};
const makeRequest=(path,{role,method='GET',body,headers={},csrfOrigin=origin}={})=>new Request(origin+path,{method,body,headers:{...(role==='viewer'?{cookie}:{}),...(role==='admin'?{'cf-access-jwt-assertion':assertion}:{}),...(method==='POST'&&csrfOrigin?{origin:csrfOrigin}:{}),...headers}});
async function call(path,options={}) {
  let nextCount=0;
  const request=makeRequest(path,options);
  const response=await onRequest({env,request,next:async()=>{
    nextCount++;
    const handler=routes[path]?.['onRequest'+request.method[0]+request.method.slice(1).toLowerCase()];
    if(handler)return handler({env,request});
    if(path==='/api/data'||path==='/data.json')return Response.json(current);
    return new Response(page,{headers:{'content-type':'text/html'}});
  }});
  return {response,nextCount};
}

test('anonymous and viewer sessions cannot reach editor, data or any write alias',async()=>{
  for(const path of [...Object.keys(routes),'/editor/','/editor.html','/editor/index.html','/editor-tools-taxonomy.js','/secret-room/editor-data','/%61pi/save','/api/upload/']) {
    for(const role of [undefined,'viewer']) {
      const {response,nextCount}=await call(path,{role});
      assert.equal(response.status,403,`${role} ${path}`);assert.equal(nextCount,0);
    }
  }
  for(const path of ['/api/save','/editor/save','/api/upload','/editor/assets','/editor/upload']) {
    for(const role of [undefined,'viewer']) {
      const result=await call(path,{role,method:'POST',body:'{}',headers:{'content-type':'application/json'}});
      assert.equal(result.response.status,403);assert.equal(result.nextCount,0);
      const direct=await routes[path].onRequestPost({request:makeRequest(path,{role,method:'POST',body:'{}'}),env});
      assert.equal(direct.status,403,'write handlers must enforce authorization independently');
    }
  }
  assert.equal(kvWrites.length,0);assert.equal(r2Writes.length,0);
});

test('viewer login still grants only private viewing; public filtering is unchanged',async()=>{
  const result=await call('/secret-room/login',{method:'POST',body:'password='+env.SECRET_ROOM_PASSWORD,headers:{'content-type':'application/x-www-form-urlencoded'}});
  assert.equal(result.response.status,303);
  assert.match(result.response.headers.get('set-cookie'),/__Host-masato-room=/);
  assert(!result.response.headers.get('set-cookie').includes('CF_Authorization'));
  assert.equal((await call('/secret-room/data')).response.status,401);
  assert.equal((await (await call('/secret-room/data',{role:'viewer'})).response.json()).portfolio.length,17);
  assert.equal((await (await call('/secret-room/data',{role:'admin'})).response.json()).portfolio.length,17);
  for(const path of ['/api/data','/data.json']) {
    const data=await (await call(path)).response.json();assert.equal(data.portfolio.length,28);assert(data.portfolio.every(x=>!isSecret(x)));
  }
  const secretPath=new URL(fixture.portfolio.find(isSecret).image).pathname;
  assert.equal((await call(secretPath)).response.status,401);
  assert.equal((await call(secretPath,{role:'viewer'})).response.status,200);
  assert.equal((await call(secretPath,{role:'admin'})).response.status,200);
});

test('Access-only administrator loads the entire collection and saves without dropping secret works or profile image',async()=>{
  for(const path of ['/editor/data','/secret-room/editor-data']) {
    const response=(await call(path,{role:'admin'})).response;
    assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
    const data=await response.json();assert.equal(data.portfolio.length,45);assert.equal(data.portfolio.filter(isSecret).length,17);
  }
  const data=projectData(fixture,'editor');data.site={...data.site,profileImage:''};
  for(const path of ['/editor/save','/api/save']) {
    const response=(await call(path,{role:'admin',method:'POST',body:JSON.stringify(data),headers:{'content-type':'application/json'}})).response;
    assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
    const stored=JSON.parse(kvWrites.at(-1).value);
    assert.equal(stored.portfolio.length,45);assert.equal(stored.portfolio.filter(isSecret).length,17);
    assert.equal(stored.site.profileImage,'/media/existing-photo.png');
  }
  const before=kvWrites.length;
  for(const csrfOrigin of ['https://evil.example',null]) {
    const response=(await call('/editor/save',{role:'admin',method:'POST',body:'{}',csrfOrigin})).response;
    assert.equal(response.status,403);
  }
  assert.equal(kvWrites.length,before);
});

test('Access-only administrator can upload assets and profile photos; viewer cannot',async()=>{
  for(const path of ['/editor/assets','/api/upload','/editor/upload']) {
    const form=new FormData();form.append('file',new File([new Uint8Array([137,80,78,71])],'test.png',{type:'image/png'}));form.append('kind','memory');
    const response=(await call(path,{role:'admin',method:'POST',body:form})).response;
    assert.equal(response.status,200);const body=await response.json();assert(body.ok);assert(body.url);
    assert(path==='/editor/upload'?body.url.startsWith('/media/about/'):body.url.startsWith('https://assets.example.test/memory/'));
  }
  assert.equal(r2Writes.length,3);
  const before=r2Writes.length;
  for(const csrfOrigin of ['https://evil.example',null]) {
    const form=new FormData();form.append('file',new File(['test'],'test.png',{type:'image/png'}));
    assert.equal((await call('/editor/assets',{role:'admin',method:'POST',body:form,csrfOrigin})).response.status,403);
  }
  assert.equal(r2Writes.length,before);
});

test('both editor entrypoints retain identical scripts and only use Access-protected editor routes',async()=>{
  const first=await readFile(new URL('../editor.html',import.meta.url),'utf8');
  const second=await readFile(new URL('../editor/index.html',import.meta.url),'utf8');
  assert.equal(first,second);
  for(const match of first.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  assert(first.includes("const candidates = ['/editor/data']"));
  assert(first.includes("fetch('/editor/save'"));assert(first.includes("fetch('/editor/assets'"));assert(first.includes("fetch('/editor/upload'"));
  assert(!first.includes("fetch('/api/"));assert(!first.includes("'/secret-room/editor-data'"));
});
