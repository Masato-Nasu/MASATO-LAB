export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const src = requestUrl.searchParams.get('src') || '';
  const trimmed = String(src || '').trim();

  if (!trimmed) {
    return new Response('Missing src', { status: 400 });
  }

  let assetUrl;
  try {
    assetUrl = new URL(trimmed, requestUrl.origin);
  } catch {
    return new Response('Invalid src', { status: 400 });
  }

  if (!['http:', 'https:'].includes(assetUrl.protocol)) {
    return new Response('Invalid src', { status: 400 });
  }

  // Allow relative paths and same-origin absolute URLs only.
  if (assetUrl.origin !== requestUrl.origin) {
    return new Response('Cross-origin src is not allowed', { status: 400 });
  }

  if (assetUrl.pathname.startsWith('/api/')) {
    return new Response('Invalid src', { status: 400 });
  }

  const upstream = await fetch(assetUrl.toString());

  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers
    });
  }

  const headers = new Headers(upstream.headers);
  headers.set('X-Robots-Tag', 'noindex, noimageindex');
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=86400');
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}
