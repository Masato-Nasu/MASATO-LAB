import worker from '../../../lib/grammar-worker.mjs';

export function onRequest({request, env}) {
  const url = new URL(request.url);
  if (url.pathname === '/apps/grammar-studio') {
    url.pathname += '/';
    return Response.redirect(url, 308);
  }
  return worker.fetch(request, env);
}
