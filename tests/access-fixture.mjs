import {DEFAULT_ADMIN_ISSUER,DEFAULT_ADMIN_AUD} from '../functions/_admin-access.js';
const encode=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');

export async function accessFixture() {
  async function makeSigner(kid) {
    const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
    const jwk = {...await crypto.subtle.exportKey('jwk',pair.publicKey),kid,alg:'RS256',use:'sig'};
    const sign = async (claims={},header={})=>{
      const now=Math.floor(Date.now()/1000);
      const a=encode({alg:'RS256',kid,...header});
      const b=encode({iss:DEFAULT_ADMIN_ISSUER,aud:[DEFAULT_ADMIN_AUD],sub:'test-admin',email:'admin@example.test',type:'app',iat:now,exp:now+3600,...claims});
      const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(`${a}.${b}`));
      return `${a}.${b}.${Buffer.from(sig).toString('base64url')}`;
    };
    return {jwk,sign};
  }
  const signer=await makeSigner('test-current');
  const originalFetch=globalThis.fetch;
  let keys=[signer.jwk],calls=0,unavailable=false;
  globalThis.fetch=async (url,options)=>{
    if(url!==`${DEFAULT_ADMIN_ISSUER}/cdn-cgi/access/certs`)throw new Error('Unexpected external call in offline test');
    if(options?.redirect!=='error')throw new Error('Key fetch must reject redirects');
    calls++;
    return unavailable ? new Response('Unavailable',{status:503}) : Response.json({keys});
  };
  return {...signer,makeSigner,restore:()=>{globalThis.fetch=originalFetch;},setKeys:value=>{keys=value;},setUnavailable:value=>{unavailable=value;},get calls(){return calls;}};
}
