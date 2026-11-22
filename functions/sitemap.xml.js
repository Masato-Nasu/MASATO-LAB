import {readMemory, unavailable} from '../lib/memory-data.js';
import {buildSlugs} from '../lib/memory-render.mjs';

export async function onRequestGet({env}) {
  let data;
  try { data = await readMemory(env); }
  catch { return unavailable(); }
  const paths = ['/memory', ...buildSlugs(data.memory).map(slug => '/memory/' + encodeURIComponent(slug))];
  const urls = paths.map(path => '<url><loc>https://masato-lab.pages.dev' + path + '</loc></url>');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>', {
    headers: {'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-store'}
  });
}
