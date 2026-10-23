import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {adminAuthenticated,inspectAdminAccess,requireAdmin,DEFAULT_ADMIN_AUD,DEFAULT_ADMIN_ISSUER} from '../functions/_admin-access.js';
import {accessFixture} from './access-fixture.mjs';
const fixture=await accessFixture();
after(()=>fixture.restore());
const request=(value,headers={})=>new Request('https://masato-lab.pages.dev/editor/save',{headers:{...(value?{'cf-access-jwt-assertion':value}:{}),...headers}});

test('only cryptographically verified editor Access credentials are administrators',async()=>{
  const valid=await fixture.sign();
  assert(await adminAuthenticated(request(valid),{}));
  assert(await adminAuthenticated(request(null,{cookie:`CF_Authorization=${valid}`}),{}));
  assert(await adminAuthenticated(request(await fixture.sign({aud:DEFAULT_ADMIN_AUD})),{}));
  assert(!await adminAuthenticated(request(null),{}));
  assert(!await adminAuthenticated(request(null,{'cf-access-authenticated-user-email':'admin@example.test',cookie:'__Host-masato-room=anything'}),{}));
  assert(!await adminAuthenticated(request(valid),{ADMIN_ACCESS_AUD:''}));
  assert(!await adminAuthenticated(request(valid),{ADMIN_ACCESS_ISSUER:'http://evil.example'}));
  assert(!await adminAuthenticated(request(valid),{ADMIN_ACCESS_AUD:'0'.repeat(64)}));
  assert(!await adminAuthenticated(request('bad.jwt.value',{cookie:`CF_Authorization=${valid}`}),{}),'invalid assertion must not fall back to cookie');
});

test('tampering, other applications, wrong issuers, expired and future tokens fail closed',async()=>{
  const now=Math.floor(Date.now()/1000);
  for(const claims of [{aud:['0'.repeat(64)]},{aud:[]},{aud:[DEFAULT_ADMIN_AUD,1]},{iss:'https://evil.cloudflareaccess.com'},{exp:now-1},{exp:null},{exp:'9999999999'},{nbf:now+120},{iat:now+120}]) {
    assert(!await adminAuthenticated(request(await fixture.sign(claims)),{}),JSON.stringify(claims));
  }
  for(const header of [{alg:'none'},{alg:'HS256'},{kid:'unknown-key'},{crit:['unexpected']},{kid:'../../anything'}]) {
    assert(!await adminAuthenticated(request(await fixture.sign({},header)),{}),JSON.stringify(header));
  }
  const valid=await fixture.sign();
  const parts=valid.split('.');
  parts[1]=Buffer.from(JSON.stringify({iss:DEFAULT_ADMIN_ISSUER,aud:[DEFAULT_ADMIN_AUD],exp:now+99999})).toString('base64url');
  assert(!await adminAuthenticated(request(parts.join('.')),{}));
  const attacker=await fixture.makeSigner('test-current');
  assert(!await adminAuthenticated(request(await attacker.sign({}, {jku:'https://evil.example/keys'})),{}));
});

test('diagnostics distinguish failures without echoing cookies, tokens, claims or upstream contents',async()=>{
  assert.deepEqual(await inspectAdminAccess(request(null),{}),{authenticated:false,reason:'missing_access_token'});
  assert.equal((await inspectAdminAccess(request('bad.token.value'),{})).reason,'invalid_access_token');
  const wrongAudience=await fixture.sign({aud:['0'.repeat(64)]});
  const denied=await requireAdmin(request(wrongAudience),{});
  assert.equal(denied.status,403);
  const body=await denied.json();
  assert.deepEqual(body,{ok:false,error:'administrator_access_required',reason:'access_audience_mismatch'});
  const serialized=JSON.stringify(body);
  assert(!serialized.includes(wrongAudience));assert(!serialized.includes('admin@example.test'));
  assert(!serialized.includes(DEFAULT_ADMIN_AUD));assert(!serialized.includes(DEFAULT_ADMIN_ISSUER));
  assert.equal((await inspectAdminAccess(request(await fixture.sign({iss:'https://wrong.cloudflareaccess.com'})),{})).reason,'access_issuer_mismatch');
  assert.equal((await inspectAdminAccess(request(await fixture.sign({exp:1})),{})).reason,'access_token_expired_or_invalid');
});

test('JWKS cache supports rotation and denies access if refreshed keys are unavailable',async()=>{
  const originalNow=Date.now,base=originalNow();
  try {
    const second=await fixture.makeSigner('test-rotated');
    fixture.setKeys([second.jwk]);
    Date.now=()=>base+31000;
    assert(await adminAuthenticated(request(await second.sign()),{}));
    fixture.setUnavailable(true);
    Date.now=()=>base+7*60*1000;
    assert(!await adminAuthenticated(request(await second.sign()),{}));
    fixture.setUnavailable(false);
    assert(await adminAuthenticated(request(await second.sign()),{}));
  } finally { Date.now=originalNow; }
});


test('key endpoint redirects are rejected without following or granting access',async()=>{
  const originalNow=Date.now,base=originalNow();
  try {
    Date.now=()=>base+15*60*1000;
    fixture.setRedirect(true);
    const result=await inspectAdminAccess(request(await fixture.sign()),{});
    assert.deepEqual(result,{authenticated:false,reason:'access_keys_unavailable'});
  } finally { Date.now=originalNow; fixture.setRedirect(false); }
});
