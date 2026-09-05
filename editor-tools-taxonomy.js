(()=>{
  const CATEGORY_OPTIONS=[
    ['', 'AUTO（自動判定）'],
    ['language-learning','LANGUAGE・LEARNING'],
    ['photo-camera','PHOTO・CAMERA'],
    ['music-sound','MUSIC・SOUND'],
    ['life-utility','LIFE・UTILITY'],
    ['cipher-security','CIPHER・SECURITY'],
    ['visual-math','VISUAL・MATH'],
    ['6seg','6SEG'],
    ['art-concept','ART・CONCEPT']
  ];
  const PLATFORM_OPTIONS=[
    ['', 'AUTO（自動判定）'],
    ['web','WEB・PWA'],
    ['android','ANDROID'],
    ['ai','AI'],
    ['web,ai','WEB・PWA + AI'],
    ['android,ai','ANDROID + AI'],
    ['both','WEB・PWA + ANDROID'],
    ['web,android,ai','WEB・PWA + ANDROID + AI']
  ];

  function optionHtml(options){
    return options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
  }

  function ensureControls(){
    if(document.getElementById('tools-category')) return;
    const stack=document.querySelector('#section-tools .stack');
    if(!stack) return;
    const titleField=document.getElementById('tools-title')?.closest('.field');
    if(!titleField) return;

    const row=document.createElement('div');
    row.className='grid2';
    row.id='tools-taxonomy-row';
    row.innerHTML=`
      <div class="field">
        <label>Category</label>
        <select id="tools-category">${optionHtml(CATEGORY_OPTIONS)}</select>
      </div>
      <div class="field">
        <label>Platform</label>
        <select id="tools-platform">${optionHtml(PLATFORM_OPTIONS)}</select>
      </div>`;
    titleField.insertAdjacentElement('afterend',row);

    const note=document.createElement('div');
    note.className='preview-note';
    note.id='tools-taxonomy-note';
    note.textContent='Category は「何をするアプリか」で選びます。Platform の AI は WEB・PWA / ANDROID と併用できます。AUTO は新規項目の補助用です。';
    row.insertAdjacentElement('afterend',note);
  }

  function selectedTool(){
    try{
      return state.currentType==='tools'&&state.selectedIndex>=0
        ? state.data.tools[state.selectedIndex]
        : null;
    }catch(_){return null;}
  }

  function platformChoice(rawPlatform){
    const set=new Set();
    const raw=Array.isArray(rawPlatform)?rawPlatform:String(rawPlatform||'').split(/[,/|+]/);
    raw.map(v=>String(v).trim().toLowerCase()).forEach(v=>{
      if(!v) return;
      if(v==='both'||v==='all'){set.add('web');set.add('android');return;}
      if(/android|apk|play/.test(v)) set.add('android');
      if(/web|pwa|browser/.test(v)) set.add('web');
      if(v==='ai'||/openai|gpt|claude|gemini|llm/.test(v)) set.add('ai');
    });
    if(set.has('web')&&set.has('android')&&set.has('ai')) return 'web,android,ai';
    if(set.has('web')&&set.has('android')) return 'both';
    if(set.has('web')&&set.has('ai')) return 'web,ai';
    if(set.has('android')&&set.has('ai')) return 'android,ai';
    if(set.has('web')) return 'web';
    if(set.has('android')) return 'android';
    if(set.has('ai')) return 'ai';
    return '';
  }

  function syncControls(){
    ensureControls();
    const category=document.getElementById('tools-category');
    const platform=document.getElementById('tools-platform');
    if(!category||!platform) return;
    const tool=selectedTool();
    category.value=tool?.category||tool?.genre||'';
    if(![...category.options].some(opt=>opt.value===category.value)) category.value='';
    platform.value=platformChoice(tool?.platform);
    if(![...platform.options].some(opt=>opt.value===platform.value)) platform.value='';
  }

  ensureControls();

  if(typeof renderForm==='function'){
    const originalRenderForm=renderForm;
    renderForm=function(){
      originalRenderForm();
      syncControls();
    };
  }

  if(typeof collectTools==='function'){
    const originalCollectTools=collectTools;
    collectTools=function(){
      const tool=originalCollectTools();
      ensureControls();
      const category=document.getElementById('tools-category')?.value||'';
      const platform=document.getElementById('tools-platform')?.value||'';
      if(category) tool.category=category;
      if(platform) tool.platform=platform;
      return tool;
    };
  }

  document.addEventListener('change',event=>{
    if(event.target?.id==='tools-category'||event.target?.id==='tools-platform'){
      try{markDirty(true);}catch(_){}
    }
  });

  syncControls();
  try{if(state.currentType==='tools') render();}catch(_){}
})();