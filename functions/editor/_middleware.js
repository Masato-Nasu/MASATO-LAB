export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  const type=response.headers.get('content-type')||'';

  if(context.request.method!=='GET') return response;
  if(!type.includes('text/html')) return response;
  if(url.pathname!=='/editor/'&&url.pathname!=='/editor/index.html') return response;

  const html=await response.text();
  if(html.includes('/editor-tools-taxonomy.js')){
    return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  }

  const injected=html.replace('</body>','  <script src="/editor-tools-taxonomy.js"></script>\n</body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');

  return new Response(injected,{
    status:response.status,
    statusText:response.statusText,
    headers
  });
}
