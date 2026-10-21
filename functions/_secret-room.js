// Classification is applied on the server, including before a first editor save.
const titles = new Set([
  'ドリップバックが浸からないドリップバックスタンド',
  'ニコニコウエットシートのフタ（くるくる、夕焼けライオン）',
  'ニコニコウエットシートのフタ（ワクワク、北極シロクマ）',
  'ふるだけひと口三角おにぎり', '味噌のフタ', '大葉保存ケース',
  'NAF 粉ふり計量スプーン', '1dp 密着しない歯ブラシスタンド＆水切れできるコップ',
  'ブラシスタンド 3WAY', 'コンパクト指ローラー',
  'ウェットシートのフタ ミニ ミラー付き', 'ワンプッシュウェットシートの蓋',
  'キラキラ☆プリキュアアラモード　まぜまぜ変身！スイーツパクト',
  'HYPENYX.45', 'G2026', 'TYPE 0114', 'HYPENYX.45 COMPACT'
]);
export const isSecret = item => item?.secretRoom === true || titles.has(item?.title);
export function slugs(items) {
  const used = new Map();
  return items.map((item,index) => {
    const key = String(item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const hidden = item.noSnippet === true || key === 'smott' || key === 'airnium';
    const raw = hidden ? `work-${index+1}` : item.slug || item.title || `item-${index+1}`;
    const base = String(raw).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/^-+|-+$/g,'') || 'item';
    const n = used.get(base) || 0; used.set(base,n+1);
    return n ? `${base}-${n+1}` : base;
  });
}
export function projectData(data, mode = 'public') {
  const items = Array.isArray(data.portfolio) ? data.portfolio : [];
  const paths = slugs(items);
  return {...data, portfolio: items.map((item,i) => ({...item, slug: paths[i], secretRoom: isSecret(item)})).filter(item => mode === 'editor' || (mode === 'secret' ? item.secretRoom : !item.secretRoom))};
}
export async function readData(env) {
  const raw = await env.SITE_DATA?.get('site-data');
  if (!raw) throw new Error('Site data unavailable');
  return JSON.parse(raw);
}
export function assetPaths(items, origin) {
  const paths = new Set();
  const walk = value => {
    if (typeof value === 'string' && /^(https?:\/\/|\/?(?:media|images)\/)/.test(value)) {
      try {
        const url = new URL(value,origin);
        if (url.origin === origin || url.hostname === 'masato-lab.pages.dev') paths.add(decodeURIComponent(url.pathname));
      } catch {}
    } else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  items.forEach(walk);
  return paths;
}
const encoder = new TextEncoder();
async function key(password) {
  return crypto.subtle.importKey('raw',encoder.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function base64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
export async function token(password, expiry = Date.now()+8*60*60*1000) {
  const payload = `secret-room-v1.${expiry}`;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC',await key(password),encoder.encode(payload)));
  return `${payload}.${base64(signature)}`;
}
export async function authenticated(request, env) {
  if (!env.SECRET_ROOM_PASSWORD || env.SECRET_ROOM_PASSWORD.length < 12) return false;
  const value = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-masato-room='))?.slice(19);
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3 || parts[0] !== 'secret-room-v1') return false;
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now()+8*60*60*1000+5000) return false;
  try {
    const bytes = Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC',await key(env.SECRET_ROOM_PASSWORD),bytes,encoder.encode(`${parts[0]}.${parts[1]}`));
  } catch { return false; }
}
export const privateHeaders = {'cache-control':'private, no-store, max-age=0','x-robots-tag':'noindex, noimageindex, noarchive','referrer-policy':'same-origin','vary':'Cookie'};
export function json(value,status=200) { return new Response(JSON.stringify(value),{status,headers:{...privateHeaders,'content-type':'application/json; charset=utf-8'}}); }
export function safeNext(value) {
  if (!value || !/^\/(?:portfolio(?:\/|$)|secret-room(?:\/|$)|editor(?:\/|\.|$))/.test(value) || /[\\\r\n]/.test(value)) return '/secret-room';
  return value;
}
export function loginPage(next = '/secret-room', message = '') {
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noimageindex"><title>SECRET ROOM / MASATO NASU</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f5f3;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif}main{max-width:560px;margin:12vh auto;padding:32px}a{color:inherit;text-decoration:none}h1{font-size:clamp(32px,8vw,54px);letter-spacing:-.04em;line-height:1.05;margin:40px 0 20px}p{line-height:1.8;color:#666}label{display:block;margin:32px 0 10px;font-size:14px}input{width:100%;font-size:18px;padding:16px;border:1px solid #ccc;border-radius:12px;background:white}button{width:100%;padding:17px;margin:16px 0;border:0;border-radius:99px;background:#111;color:#fff;font-size:14px;letter-spacing:.08em;cursor:pointer}.error{color:#a22}.back{display:inline-block;margin-top:24px;font-size:14px}</style><main><a href="/">MASATO NASU</a><h1>SECRET ROOM</h1><p>限られた方へご紹介する作品を収めています。<br>パスワードを入力してお入りください。</p>${message?`<p class="error" role="alert">${esc(message)}</p>`:''}<form method="post" action="/secret-room/login"><input type="hidden" name="next" value="${esc(safeNext(next))}"><label for="password">パスワード</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">ENTER</button></form><a class="back" href="/portfolio">← BACK TO PORTFOLIO</a></main></html>`;
}
