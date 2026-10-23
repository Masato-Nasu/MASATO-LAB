// Public Access application identifiers, confirmed from /editor's login redirect.
// These are not credentials. Never derive the trusted issuer/audience from a JWT.
export const DEFAULT_ADMIN_ISSUER = 'https://masato-lab.cloudflareaccess.com';
export const DEFAULT_ADMIN_AUD = '36b8587e62d90afdadd1e735f4ab4c163e94884a451ff7a047c0012d8db439c4';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal:true});
const CACHE_MS = 5 * 60 * 1000;
const REFRESH_MS = 30 * 1000;
let cached;
let pending;

export function adminAccessConfig(env = {}) {
  const issuer = String(env.ADMIN_ACCESS_ISSUER ?? DEFAULT_ADMIN_ISSUER).replace(/\/$/, '');
  const audience = String(env.ADMIN_ACCESS_AUD ?? DEFAULT_ADMIN_AUD).trim();
  // Only a deployment's explicit configuration selects the key endpoint.
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !/^[a-f0-9]{64}$/.test(audience)) return null;
  return {issuer, audience};
}

function decode(part) {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid base64url');
  const value = part.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(value + '='.repeat((4-value.length%4)%4)), c=>c.charCodeAt(0));
}

async function publicKeys(issuer, kid) {
  const now = Date.now();
  if (cached?.issuer === issuer && now-cached.loaded < CACHE_MS) {
    if (cached.keys.some(key=>key.kid===kid) || now-cached.loaded < REFRESH_MS) return cached.keys;
  }
  if (pending?.issuer === issuer) return pending.promise;
  const promise = (async()=>{
    const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      redirect:'error', signal:AbortSignal.timeout(5000),
      headers:{accept:'application/json'}
    });
    if (!response.ok) throw new Error('Access keys unavailable');
    const jwks = await response.json();
    if (!Array.isArray(jwks.keys) || !jwks.keys.length || jwks.keys.length > 20) throw new Error('Invalid Access keys');
    const keys = jwks.keys.filter(key=>key.kty==='RSA' && key.alg==='RS256' && key.use==='sig' && typeof key.n==='string' && typeof key.e==='string');
    if (!keys.length) throw new Error('Invalid Access keys');
    cached = {issuer,keys,loaded:Date.now()};
    return keys;
  })();
  const operation = {issuer,promise};
  pending = operation;
  try { return await promise; }
  finally { if (pending === operation) pending = undefined; }
}

// Only fixed reason codes leave this function: never return/log a token, claim,
// cookie, key or upstream response. This also makes production failures actionable.
export async function inspectAdminAccess(request, env) {
  const fail = reason => ({authenticated:false,reason});
  const config = adminAccessConfig(env);
  if (!config) return fail('invalid_admin_configuration');
  // /editor/* uses the edge assertion. The verified cookie also supports old
  // /api/* callers; possession of a secret-room cookie is never sufficient.
  const assertion = request.headers.get('cf-access-jwt-assertion');
  const cookies = (request.headers.get('cookie') || '').split(';').map(x=>x.trim());
  const cookie = cookies.find(x=>x.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const value = assertion || cookie;
  if (!value) return fail('missing_access_token');
  if (value.length > 16384) return fail('invalid_access_token');
  try {
    const parts = value.split('.');
    if (parts.length !== 3) return fail('invalid_access_token');
    const header = JSON.parse(decoder.decode(decode(parts[0])));
    const claims = JSON.parse(decoder.decode(decode(parts[1])));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(header.kid) || header.crit !== undefined) return fail('invalid_token_header');
    const now = Date.now()/1000;
    if (claims.iss !== config.issuer) return fail('access_issuer_mismatch');
    if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= now) return fail('access_token_expired_or_invalid');
    if (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf) || claims.nbf > now)) return fail('access_token_not_yet_valid');
    if (claims.iat !== undefined && (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat) || claims.iat > now+30)) return fail('access_token_issued_in_future');
    const audiences = typeof claims.aud === 'string' ? [claims.aud] : claims.aud;
    if (!Array.isArray(audiences) || !audiences.every(x=>typeof x==='string') || !audiences.includes(config.audience)) return fail('access_audience_mismatch');
    let keys;
    try { keys = await publicKeys(config.issuer,header.kid); }
    catch { return fail('access_keys_unavailable'); }
    const jwk = keys.find(key=>key.kid===header.kid);
    if (!jwk) return fail('access_signing_key_unknown');
    try {
      const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
      const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(`${parts[0]}.${parts[1]}`));
      return verified ? {authenticated:true,reason:'verified'} : fail('access_signature_invalid');
    } catch { return fail('access_signature_validation_failed'); }
  } catch { return fail('invalid_access_token'); }
}

export async function adminAuthenticated(request,env) {
  return (await inspectAdminAccess(request,env)).authenticated;
}

export function adminDenied(reason) {
  return Response.json({ok:false,error:'administrator_access_required',reason}, {
    status:403, headers:{'cache-control':'private, no-store','vary':'Cookie, Cf-Access-Jwt-Assertion'}
  });
}

// Keep this check in handlers as well as middleware so every legacy alias and
// future re-export of a write handler retains the same authorization boundary.
export async function requireAdmin(request,env) {
  const access = await inspectAdminAccess(request,env);
  if (!access.authenticated) return adminDenied(access.reason);
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ok:false,error:'invalid_origin'}, {status:403,headers:{'cache-control':'no-store'}});
  }
  return null;
}
