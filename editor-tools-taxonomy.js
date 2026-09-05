(()=>{
  const CATEGORY_OPTIONS=[
    ['', 'AUTO（自動判定）'],
    ['ai-language','AI・LANGUAGE'],
    ['camera-image','CAMERA・IMAGE'],
    ['audio-music','AUDIO・MUSIC'],
    ['productivity','PRODUCTIVITY'],
    ['security-cipher','SECURITY・CIPHER'],
    ['visual-generative','VISUAL・GENERATIVE'],
    ['memory-lifelog','MEMORY・LIFELOG'],
    ['experiment','EXPERIMENT']
  ];
  const PLATFORM_OPTIONS=[
    ['', 'AUTO（自動判定）'],
    ['web','WEB・PWA'],
    ['android','ANDROID'],
    ['both','WEB・PWA + ANDROID']
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
    note.textContent='AUTO の場合はタイトル・説明・タグから自動分類します。必要な作品だけ手動指定できます。';
    row.insertAdjacentElement('afterend',note);
  }

  function selectedTool(){
    try{
      return state.currentType==='tools'&&state.selectedIndex>=0
        ? state.data.tools[state.selectedIndex]
        : null;
    }catch(_){return null;}
  }

  function syncControls(){
    ensureControls();
    const category=document.getElementById('tools-category');
    const platform=document.getElementById('tools-platform');
    if(!category||!platform) return;
    const tool=selectedTool();
    category.value=tool?.category||tool?.genre||'';
    const rawPlatform=tool?.platform;
    if(Array.isArray(rawPlatform)){
      const lower=rawPlatform.map(v=>String(v).toLowerCase());
      platform.value=lower.includes('web')&&lower.includes('android')?'both':lower.includes('android')?'android':lower.includes('web')?'web':'';
    }else{
      platform.value=String(rawPlatform||'').toLowerCase();
      if(!['','web','android','both'].includes(platform.value)) platform.value='';
    }
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
