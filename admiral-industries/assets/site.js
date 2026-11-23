(()=>{
 const root=document.documentElement;let initial='ja';try{initial=localStorage.getItem('admiral-lang')||'ja'}catch(e){}root.dataset.language=initial==='en'?'en':'ja';root.lang=root.dataset.language;
 document.querySelector('.lang-btn')?.addEventListener('click',()=>{const next=root.dataset.language==='ja'?'en':'ja';root.dataset.language=next;root.lang=next;try{localStorage.setItem('admiral-lang',next)}catch(e){}});
 const menu=document.querySelector('.menu-btn'),nav=document.querySelector('header nav');menu?.addEventListener('click',()=>nav.classList.toggle('open'));nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
 // Prefer the exact images used in MASATO LAB TOOLS on this same site. Keep authentic repository screenshots as fallback.
 const normalize = value => String(value||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]/g,'');
 const aliases={'sana-radio':['SANA RADIO'],'jflatbad':['JFLATBAD'],'jiji-fighter':['JIJI FIGHTER'],'hyper-haiku':['HYPER HAIKU']};
 fetch('/api/data',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
   const tools=Array.isArray(data.tools)?data.tools:[];
   for (const [id,names] of Object.entries(aliases)){
     const entry=tools.find(t=>names.some(name=>normalize(t.title)===normalize(name)));
     if (!entry) continue;
     if (entry.image) {
       try { const u=new URL(entry.image,location.origin);if(u.protocol==='https:'){
         document.querySelectorAll('[data-tool-image="'+id+'"]').forEach(img=>{
           const fallback=img.src;img.onerror=()=>{img.onerror=null;img.src=fallback};img.src=u.href;
         });
       }} catch(e){}
     }
     // Published app URLs are verified separately in our product pages.
   }
 }).catch(()=>{});
 document.querySelectorAll('.app-launch').forEach(link=>link.addEventListener('click',()=>{
   const id=link.dataset.launch;if(!id)return;
   try{fetch('/api/admiral/launch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id}),keepalive:true}).catch(()=>{});}catch(e){}
 }));
 if(document.querySelector('#metric-count')){
  const txt=(ja,en)=>root.dataset.language==='en'?en:ja;const vals={'sana-radio':100,'jflatbad':100,'jiji-fighter':50,'hyper-haiku':50};const names={'sana-radio':'SANA RADIO',jflatbad:'JFLATBAD','jiji-fighter':'JIJI FIGHTER','hyper-haiku':'HYPER HAIKU'};
  fetch('/api/admiral/stats',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    if(!data.configured)throw Error('UNCONFIGURED');const counts=data.counts||{};let total=0,rev=0,leader='',max=-1;
    Object.keys(vals).forEach(id=>{const n=Number(counts[id]||0);total+=n;rev+=n*vals[id];if(n>max){max=n;leader=id}});
    document.querySelector('#metric-count').textContent=total.toLocaleString();document.querySelector('#metric-revenue').textContent='¥'+rev.toLocaleString();document.querySelector('#metric-leader').textContent=total?names[leader]:'—';
    const note=document.querySelector('#metric-note');note.textContent=txt('公開サイトからの起動クリックを集計しています。仮想売上＝製品別起動数×社内換算額（50円または100円）。','Counts track launch clicks from this website. Simulated revenue = launches × internal values (¥50 or ¥100 per title).');
    const msg=total?txt('会長、累計'+total.toLocaleString()+'件の起動が記録されています。現時点では'+names[leader]+'が最多です。引き続き利用状況を見ながら、新規開発の優先順位を検討いたします。','Chairman, '+total.toLocaleString()+' launches have been recorded. '+names[leader]+' currently leads. I will use these results to evaluate our development priorities.'):
    txt('会長、集計を開始いたしました。利用実績が蓄積された時点で、商品開発の方針に反映いたします。','Chairman, tracking is now active. I will incorporate the results into our development decisions as usage data becomes available.');
    document.querySelector('#president-report').textContent=msg;
  }).catch(()=>{document.querySelector('#metric-note').textContent=txt('共有集計は現在利用できません。架空の数字は表示しません。','Shared analytics are not configured. No fabricated data is shown.');document.querySelector('#president-report').textContent=txt('会長、集計基盤の準備が整うまで、数値による業績報告は控えさせていただきます。','Chairman, I will refrain from reporting numerical results until our tracking infrastructure is configured.');});
 }
})();