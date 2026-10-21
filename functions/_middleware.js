import {isSecret, slugs, projectData, readData, assetPaths, token, authenticated, privateHeaders, json, safeNext, loginPage} from './_secret-room.js';
const html = (body,status=200) => new Response(body,{status,headers:{...privateHeaders,'content-type':'text/html; charset=utf-8','content-security-policy':"frame-ancestors 'none'; form-action 'self'; base-uri 'self'"}});
const redirect = (location,cookie) => new Response(null,{status:303,headers:{...privateHeaders,location,...(cookie?{'set-cookie':cookie}:{})}});
const allowedOrigin = request => request.headers.get('origin') === new URL(request.url).origin;
export async function onRequest(context) {
  const {request,env} = context;
  const url = new URL(request.url);
  let path; try { path = decodeURIComponent(url.pathname).replace(/\/+$/,'') || '/'; } catch { return new Response('Bad request',{status:400}); }
  // Reject nested path encodings before a downstream router can decode them again.
  if (/%[0-9a-f]{2}/i.test(path)) return new Response('Bad request',{status:400});
  const auth = await authenticated(request,env);
  const login = next => redirect(`/secret-room/login?next=${encodeURIComponent(safeNext(next))}`);
  if (path === '/secret-room/login') {
    if (request.method === 'GET') return auth ? redirect(safeNext(url.searchParams.get('next'))) : html(loginPage(url.searchParams.get('next')));
    if (request.method !== 'POST') return new Response('Method not allowed',{status:405});
    if (!allowedOrigin(request)) return html(loginPage('/secret-room','ページを開き直してお試しください。'),403);
    if (!env.SECRET_ROOM_PASSWORD || env.SECRET_ROOM_PASSWORD.length < 12) return html(loginPage('/secret-room','現在準備中です。'),503);
    if (Number(request.headers.get('content-length') || 0)>4096) return new Response('Too large',{status:413});
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const rateKey = `secret-room-failures:${digest}`;
    // KV is a coarse backstop; an edge rate-limiting rule can enforce a strict limit.
    const failures = Number(await env.SITE_DATA.get(rateKey) || 0);
    if (failures >= 5) return html(loginPage(next,'時間をおいて、もう一度お試しください。'),429);
    if (String(form.get('password') || '') !== env.SECRET_ROOM_PASSWORD) {
      await env.SITE_DATA.put(rateKey,String(failures+1),{expirationTtl:300});
      return html(loginPage(next,'パスワードが違います。'),401);
    }
    return redirect(next,`__Host-masato-room=${await token(env.SECRET_ROOM_PASSWORD)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);
  }
  if (path === '/secret-room/logout') {
    if (request.method !== 'POST' || !allowedOrigin(request)) return new Response('Forbidden',{status:403});
    return redirect('/portfolio','__Host-masato-room=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  }
  if (path.startsWith('/editor') || ['/api/save','/editor/save','/api/upload','/editor/upload'].includes(path)) {
    if (!auth) return request.method === 'GET' ? login(url.pathname+url.search) : json({ok:false,error:'secret_room_login_required'},401);
    if (request.method !== 'GET' && request.method !== 'HEAD' && !allowedOrigin(request)) return json({ok:false,error:'invalid_origin'},403);
  }
  const room = path === '/secret-room' || path.startsWith('/secret-room/');
  const dataRoute = path === '/api/data' || path === '/data.json';
  const protectedCandidate = path.startsWith('/portfolio/') || path.startsWith('/media/') || path.startsWith('/images/') || path === '/api/image';
  let data;
  if (room || dataRoute || protectedCandidate) {
    try { data = await readData(env); } catch { return json({error:'temporarily_unavailable'},503); }
  }
  if (room) {
    if (!auth) return path.endsWith('/data') || path.endsWith('/editor-data') ? json({error:'authentication_required'},401) : login(url.pathname);
    if (path === '/secret-room/data') return json(projectData(data,'secret'));
    if (path === '/secret-room/editor-data') return json(projectData(data,'editor'));
    if (path !== '/secret-room') return new Response('Not found',{status:404,headers:privateHeaders});
    const asset = await env.ASSETS.fetch(new URL('/portfolio.html',url));
    let body = await asset.text();
    body = body.replace("const candidates = ['/api/data', './data.json', 'data.json']", "const candidates = ['/secret-room/data']")
      .replace("const candidates=['/api/data','./data.json','data.json']", "const candidates=['/secret-room/data']")
      .replace(/<h2([^>]*)>Portfolio<\/h2>/,'<h2$1>SECRET ROOM</h2>')
      .replace(/<h1([^>]*)>Portfolio<\/h1>/,'<h1$1>SECRET ROOM</h1>')
      .replace('site.portfolioIntro','"限られた方へご紹介する作品。"')
      .replace('`${site.name} / Portfolio`','`${site.name} / SECRET ROOM`')
      .replace('<script>','<form method="post" action="/secret-room/logout" style="margin-top:36px"><button class="read-more" type="submit">LOG OUT</button> <a href="/portfolio">BACK TO PORTFOLIO</a></form><script>');
    return html(body);
  }
  if (dataRoute) {
    // Keep the existing API's fixed classifications while stripping private works.
    const response = await context.next();
    if (!response.ok) return response;
    const result = await response.json();
    return json(projectData(result,'public'));
  }
  let secretDetail = false;
  if (protectedCandidate) {
    const items = data.portfolio || [];
    const secret = items.filter(isSecret);
    let candidatePath = path;
    if (path === '/api/image') {
      try { candidatePath = decodeURIComponent(new URL(url.searchParams.get('src') || '',url.origin).pathname); } catch { return new Response('Bad request',{status:400}); }
    }
    const assets = assetPaths(secret,url.origin);
    const requestedSlug = path.startsWith('/portfolio/') ? path.slice('/portfolio/'.length) : '';
    const allSlugs = slugs(items);
    // Also guard title aliases, even if noSnippet currently uses a work-N URL.
    secretDetail = !!requestedSlug && items.some((item,i)=>isSecret(item) && (allSlugs[i]===requestedSlug || String(item.slug||'')===requestedSlug));
    if ((secretDetail || assets.has(candidatePath)) && !auth) {
      return secretDetail ? login(url.pathname) : new Response('Authentication required',{status:401,headers:privateHeaders});
    }
    const response = await context.next();
    if (secretDetail || assets.has(candidatePath)) {
      const headers = new Headers(response.headers);
      Object.entries(privateHeaders).forEach(([k,v])=>headers.set(k,v));
      headers.delete('etag'); headers.delete('content-length');
      if (secretDetail && (headers.get('content-type')||'').includes('text/html')) {
        return new Response((await response.text()).replace(/href="\/portfolio"([^>]*>BACK TO PORTFOLIO)/g,'href="/secret-room"$1').replace('>BACK TO PORTFOLIO<','>BACK TO SECRET ROOM<'),{status:response.status,headers});
      }
      return new Response(response.body,{status:response.status,headers});
    }
    return response;
  }
  const response = await context.next();
  if (['/portfolio','/portfolio.html'].includes(path) && (response.headers.get('content-type')||'').includes('text/html')) {
    const headers = new Headers(response.headers); headers.delete('content-length'); headers.set('cache-control','no-store');
    const body = (await response.text()).replace('<script>','<footer style="margin-top:44px;text-align:right"><a href="/secret-room" style="font-size:12px;letter-spacing:.12em;color:#6b7280">SECRET ROOM ↗</a></footer><script>');
    return new Response(body,{status:response.status,headers});
  }
  return response;
}
