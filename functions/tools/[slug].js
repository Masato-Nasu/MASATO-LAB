function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function buildSlugs(items) {
  const used = new Map();
  return items.map((item, index) => {
    const base = slugify(item.slug || item.title || `item-${index + 1}`);
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  });
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === 'string') return tags.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function resolveImage(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  if (p.startsWith('/')) return p;
  return '/' + p.replace(/^\.\//, '');
}

function renderPage(site, item) {
  const siteName = escapeHtml(site?.name || 'MASATO NASU');
  const tagline = escapeHtml(site?.tagline || 'Product Design · Computational Experiments · Personal Lab');
  const title = escapeHtml(item.title || 'Untitled');
  const description = escapeHtml(item.description || '');
  const image = resolveImage(item.image || '');
  const fit = item.imageFit === 'cover' ? 'cover' : 'contain';
  const tags = normalizeTags(item.tags).filter(tag => !/^\s*(category|genre|platform)\s*:/i.test(tag));
  const appUrl = String(item.appUrl || '').trim();
  const repoUrl = String(item.repoUrl || '').trim();

  const media = image ? `<figure class="media"><img src="${escapeHtml(image)}" alt="${title}" style="object-fit:${fit}"></figure>` : '';
  const tagsHtml = tags.length ? `<div class="tags">${tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div>` : '';
  const links = [
    appUrl ? `<a class="btn primary" href="${escapeHtml(appUrl)}" target="_blank" rel="noopener noreferrer">OPEN APP</a>` : '',
    repoUrl ? `<a class="btn" href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener noreferrer">GITHUB</a>` : '',
    `<a class="btn" href="/tools.html">BACK TO TOOLS</a>`
  ].filter(Boolean).join('');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} / ${siteName}</title>
  <style>
    :root{--bg:#f5f5f3;--text:#111;--muted:#6b7280;--line:#d9d9d4;--card:#fff}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,"Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif}a{color:inherit;text-decoration:none}
    .wrap{max-width:1180px;margin:0 auto;padding:28px 20px 72px}.site-title{font-size:64px;line-height:.95;font-weight:800;letter-spacing:-.03em;margin:0 0 18px}.nav{display:flex;gap:22px;flex-wrap:wrap;margin:0 0 30px}.nav a{font-size:18px}.nav a.active{font-weight:700}.eyebrow{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:#fafaf7;color:var(--muted);font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:26px}
    .back{display:inline-flex;align-items:center;min-height:38px;margin:0 0 28px;color:#444;font-size:13px;font-weight:700;letter-spacing:.03em}.detail{background:var(--card);border:1px solid var(--line);border-radius:30px;padding:34px;box-shadow:0 2px 12px rgba(0,0,0,.035)}.kicker{font-size:11px;color:var(--muted);font-weight:750;letter-spacing:.12em;margin-bottom:10px}.detail h2{font-size:clamp(38px,6vw,72px);line-height:.96;letter-spacing:-.045em;margin:0 0 26px}.media{margin:0 0 30px;background:#f0f0ed;border:1px solid var(--line);border-radius:22px;overflow:hidden;display:flex;align-items:center;justify-content:center;aspect-ratio:16/10}.media img{width:100%;height:100%;display:block}.description{font-size:18px;line-height:1.95;white-space:pre-wrap;word-break:break-word;margin:0 0 26px;max-width:900px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}.tag{font-size:12px;padding:8px 10px;border-radius:999px;border:1px solid var(--line);background:#fafaf8;color:#444}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px;font-weight:700}.btn.primary{background:#111;color:#fff;border-color:#111}
    @media(max-width:640px){.wrap{padding:18px 12px 44px}.site-title{font-size:40px}.nav{gap:14px;margin-bottom:20px}.nav a{font-size:15px}.detail{padding:20px;border-radius:22px}.description{font-size:16px;line-height:1.85}.media{border-radius:16px}}
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="site-title">${siteName}</h1>
    <nav class="nav" aria-label="Main navigation"><a href="/">Home</a><a href="/portfolio.html">Portfolio</a><a href="/memory.html">Peripheral Memory</a><a href="/tools.html" class="active">Tools</a><a href="/about.html">About</a></nav>
    <div class="eyebrow">${tagline}</div><br>
    <a class="back" href="/tools.html">← BACK TO TOOLS</a>
    <article class="detail"><div class="kicker">TOOLS</div><h2>${title}</h2>${media}${description ? `<div class="description">${description}</div>` : ''}${tagsHtml}<div class="actions">${links}</div></article>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  let data = null;
  try {
    const raw = await context.env.SITE_DATA.get('site-data');
    if (raw) data = JSON.parse(raw);
  } catch (error) {
    console.error('Tools KV read failed', error);
  }

  if (!data) {
    try {
      const url = new URL('/api/data', context.request.url);
      const res = await fetch(url.toString());
      if (res.ok) data = await res.json();
    } catch (error) {
      console.error('Tools API fallback failed', error);
    }
  }

  const items = Array.isArray(data?.tools) ? data.tools : [];
  const slugs = buildSlugs(items);
  let requested = String(context.params.slug || '');
  try { requested = decodeURIComponent(requested); } catch (_) {}
  const index = slugs.indexOf(requested);

  if (index < 0) {
    return new Response('Tool not found', {status:404, headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  }

  return new Response(renderPage(data?.site || {}, items[index]), {
    headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}
  });
}
