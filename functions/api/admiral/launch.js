const ids=new Set(['sana-radio','jflatbad','jiji-fighter','hyper-haiku']);
export async function onRequestPost({request,env}) {
  const store=env.ADMIRAL_METRICS||env.SITE_DATA;
  if(!store)return Response.json({ok:false,configured:false},{status:503});
  try {
    const origin=request.headers.get('Origin');
    if(origin&&origin!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
    if(Number(request.headers.get('Content-Length')||0)>256)return new Response('Too large',{status:413});
    const input=await request.json();
    if(!ids.has(input.id))return new Response('Invalid product',{status:400});
    const key='admiral:launch:'+input.id;
    // Edge KV is eventually consistent; counts are approximate, never downloads.
    const count=Number(await store.get(key)||0);
    await store.put(key,String(count+1));
    return Response.json({ok:true});
  }catch{return new Response('Bad request',{status:400});}
}
