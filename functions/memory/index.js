import {readMemory, unavailable} from '../../lib/memory-data.js';
import {normalizeSite, buildSlugs, memoryCard} from '../../lib/memory-render.mjs';

export async function onRequestGet({env, request}) {
  let data;
  try { data = await readMemory(env); }
  catch { return unavailable(); }

  const template = await env.ASSETS.fetch(new URL('/memory', request.url));
  if (!template.ok) return unavailable();
  const site = normalizeSite(data.site);
  const slugs = buildSlugs(data.memory);
  const cards = data.memory.map((item, i) => memoryCard(item, slugs[i])).join('');
  const setText = value => ({element: el => el.setInnerContent(value)});
  const rewrite = new HTMLRewriter()
    .on('head', {element: el => el.append('<link rel="canonical" href="https://masato-lab.pages.dev/memory">', {html: true})})
    .on('title', setText(site.name + ' / Peripheral Memory'))
    .on('#site-title', setText(site.name))
    .on('#memory-eyebrow', setText(site.tagline))
    .on('#memory-intro', setText(site.memoryIntro))
    .on('#memory-count', setText(data.memory.length + ' ENTRIES'))
    .on('#memory-root', {element: el => el.setInnerContent(cards || '<section class="empty-state">まだ Peripheral Memory 項目がありません。</section>', {html: true})})
    .on('script[type="module"]', {element: el => el.remove()});
  return rewrite.transform(new Response(template.body, {
    headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}
  }));
}
