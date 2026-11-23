const ids=['sana-radio','jflatbad','jiji-fighter','hyper-haiku'];
export async function onRequestGet({env}) {
  const store=env.ADMIRAL_METRICS||env.SITE_DATA;
  if(!store)return Response.json({configured:false,counts:{}});
  try {
    const counts=Object.fromEntries(await Promise.all(ids.map(async id=>[id,Number(await store.get('admiral:launch:'+id)||0)])));
    return Response.json({configured:true,counts},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({configured:false,counts:{}},{status:503});}
}
