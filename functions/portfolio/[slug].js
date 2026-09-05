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

function normalizeKey(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function shouldNoImageIndex(item = {}) {
  if (item.noImageIndex === true) return true;
  const key = normalizeKey(item.title || '');
  return key === 'smott' || key === 'airnium';
}

function shouldNoSnippet(item = {}) {
  if (item.noSnippet === true) return true;
  const key = normalizeKey(item.title || '');
  return key === 'smott' || key === 'airnium';
}

function buildSlugs(items) {
  const used = new Map();
  return items.map((item, index) => {
    const raw = shouldNoSnippet(item) ? `work-${index + 1}` : (item.slug || item.title || `item-${index + 1}`);
    const base = slugify(raw);
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

function normalizeLinks(item = {}) {
  const raw = Array.isArray(item.links) && item.links.length ? item.links : [item.link || ''];
  return raw.map(v => String(v || '').trim()).filter(Boolean).slice(0, 3);
}

function resolveImage(path = '') {
  const p = String(path || '').trim();
  if (!p) return '';
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  if (p.startsWith('/')) return p;
  return '/' + p.replace(/^\.\//, '');
}

function protectedImage(path = '') {
  const resolved = resolveImage(path);
  if (!resolved || /^(data:|blob:)/i.test(resolved)) return resolved;
  if (/^https?:/i.test(resolved)) return resolved;
  return `/api/image?src=${encodeURIComponent(resolved)}`;
}

function ratioClass(value = '') {
  return ['1:1','4:3','3:4','2:3','16:9'].includes(String(value)) ? String(value) : '4:3';
}

function renderPage(site, item) {
  const noSnippet = shouldNoSnippet(item);
  const noImageIndex = shouldNoImageIndex(item);
  const title = escapeHtml(item.title || 'Untitled');
  const role = escapeHtml(item.role || '');
  const year = escapeHtml(item.year || '');
  const description = escapeHtml(item.description || '');
  const imageRaw = item.image || '';
  const image = noImageIndex ? protectedImage(imageRaw) : resolveImage(imageRaw);
  const ratio = ratioClass(item.imageRatio);
  const fit = item.imageFit === 'cover' ? 'cover' : 'contain';
  const tags = normalizeTags(item.tags);
  const links = normalizeLinks(item);
  const siteName = escapeHtml(site?.name || 'MASATO NASU');
  const tagline = escapeHtml(site?.tagline || 'Product Design · Computational Experiments · Personal Lab');

  const tagsHtml = tags.length
    ? `<div class="tags">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';

  const linksHtml = links.length
    ? `<div class="actions">${links.map((url, i) => `<a class="btn${i === 0 ? ' primary' : ''}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${i === 0 ? 'OPEN LINK' : `LINK ${i + 1}`}</a>`).join('')}</div>`
    : '';

  const mediaHtml = image
    ? `<figure class="media" data-ratio="${escapeHtml(ratio)}"><img src="${escapeHtml(image)}" alt="${noSnippet ? 'Portfolio image' : title}" style="object-fit:${fit}"></figure>`
    : '';

  const bodyContent = `
      <div class="work-head">
        <div>
          <div class="kicker">PORTFOLIO</div>
          <h2>${title}</h2>
          ${role ? `<div class="role">${role}</div>` : ''}
        </div>
        ${year ? `<div class="year">${year}</div>` : ''}
      </div>
      ${mediaHtml}
      ${description ? `<div class="description">${description}</div>` : ''}
      ${tagsHtml}
      ${linksHtml}`;

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
    .back{display:inline-flex;align-items:center;min-height:38px;margin:0 0 28px;color:#444;font-size:13px;font-weight:700;letter-spacing:.03em}.work{background:var(--card);border:1px solid var(--line);border-radius:30px;padding:34px;box-shadow:0 2px 12px rgba(0,0,0,.035)}.work-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:26px}.kicker{font-size:11px;color:var(--muted);font-weight:750;letter-spacing:.12em;margin-bottom:9px}.work h2{font-size:clamp(38px,6vw,72px);line-height:.96;letter-spacing:-.045em;margin:0}.role{margin-top:12px;color:var(--muted);font-size:17px}.year{flex:0 0 auto;border:1px solid var(--line);background:#fafaf8;border-radius:999px;padding:9px 14px;color:var(--muted);font-size:14px}.media{margin:0 0 30px;background:#f0f0ed;border:1px solid var(--line);border-radius:22px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:300px}.media[data-ratio="1:1"]{aspect-ratio:1/1}.media[data-ratio="4:3"]{aspect-ratio:4/3}.media[data-ratio="3:4"]{aspect-ratio:3/4}.media[data-ratio="2:3"]{aspect-ratio:2/3}.media[data-ratio="16:9"]{aspect-ratio:16/9}.media img{width:100%;height:100%;display:block}.description{font-size:18px;line-height:1.95;white-space:pre-wrap;word-break:break-word;margin:0 0 26px;max-width:900px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}.tag{font-size:12px;padding:8px 10px;border-radius:999px;border:1px solid var(--line);background:#fafaf8;color:#444}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px;font-weight:700}.btn.primary{background:#111;color:#fff;border-color:#111}
    @media(max-width:640px){.wrap{padding:18px 12px 44px}.site-title{font-size:40px}.nav{gap:14px;margin-bottom:20px}.nav a{font-size:15px}.work{padding:20px;border-radius:22px}.work-head{flex-direction:column;gap:14px}.year{align-self:flex-start}.description{font-size:16px;line-height:1.85}.media{border-radius:16px;min-height:220px}}
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="site-title">${siteName}</h1>
    <nav class="nav" aria-label="Main navigation">
      <a href="/">Home</a><a href="/portfolio.html" class="active">Portfolio</a><a href="/memory.html">Peripheral Memory</a><a href="/tools.html">Tools</a><a href="/about.html">About</a>
    </nav>
    <div class="eyebrow">${tagline}</div><br>
    <a class="back" href="/portfolio.html">← BACK TO PORTFOLIO</a>
    <article class="work">${noSnippet ? `<div data-nosnippet>${bodyContent}</div>` : bodyContent}</article>
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
    console.error('Portfolio KV read failed', error);
  }

  if (!data) {
    try {
      const url = new URL('/api/data', context.request.url);
      const res = await fetch(url.toString());
      if (res.ok) data = await res.json();
    } catch (error) {
      console.error('Portfolio API fallback failed', error);
    }
  }

  const items = Array.isArray(data?.portfolio) ? data.portfolio : [];
  const slugs = buildSlugs(items);
  let requested = String(context.params.slug || '');
  try { requested = decodeURIComponent(requested); } catch (_) {}
  const index = slugs.indexOf(requested);

  if (index < 0) {
    return new Response('Portfolio item not found', {
      status: 404,
      headers: {'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}
    });
  }

  return new Response(renderPage(data?.site || {}, items[index]), {
    headers: {'content-type':'text/html; charset=utf-8','cache-control':'no-store'}
  });
}
