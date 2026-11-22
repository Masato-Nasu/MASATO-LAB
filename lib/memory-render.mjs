export function normalizeSite(site={}){return{name:site.name||'MASATO NASU',tagline:site.tagline||'Product Design · Computational Experiments · Personal Lab',memoryIntro:site.memoryIntro||'Links and notes that remain nearby, ready to be revisited.'};}

export function escapeHtml(value=''){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function normalizeTags(tags){if(Array.isArray(tags))return tags.filter(Boolean);if(typeof tags==='string')return tags.split(',').map(s=>s.trim()).filter(Boolean);return[];}

function slugify(value=''){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/^-+|-+$/g,'')||'item';}

export function buildSlugs(items){const used=new Map();return items.map((item,index)=>{const raw=item.slug||item.title||`memory-${index+1}`;const base=slugify(raw);const count=used.get(base)||0;used.set(base,count+1);return count?`${base}-${count+1}`:base;});}

function ratioOf(item){const r=String(item.imageRatio||'').trim();return['1:1','4:3','3:4','2:3','16:9'].includes(r)?r:'4:3';}

function clampNumber(value,fallback,min,max){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}

export function memoryCard(item,slug){const title=escapeHtml(item.title||'Untitled');const comment=escapeHtml(String(item.comment||'').replace(/^#{1,6}\s+.*$/gm,'').replace(/\*\*/g,'').trim());const date=escapeHtml(item.date||'');const image=String(item.image||'').trim();const ratio=ratioOf(item);const fit=item.imageFit==='cover'?'cover':'contain';const scale=clampNumber(item.listImageScale,100,60,140)/100;const x=clampNumber(item.listImageX,0,-25,25);const y=clampNumber(item.listImageY,0,-25,25);const tags=normalizeTags(item.tags);const shown=tags.slice(0,3);const extra=Math.max(0,tags.length-shown.length);const tagsHtml=shown.length||extra?`<div class="tags">${shown.map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}${extra?`<span class="tag">+${extra}</span>`:''}</div>`:'';const media=image?`<div class="memory-media" data-ratio="${escapeHtml(ratio)}"><img src="${escapeHtml(image)}" alt="${title}" loading="lazy" style="object-fit:${fit};transform:translate(${x}%,${y}%) scale(${scale})"></div>`:'';const detail=`/memory/${encodeURIComponent(slug)}`;return`<article class="memory-card${image?'':' no-image'}">${media}<div class="memory-content"><div class="memory-head"><h3 class="memory-title"><a href="${detail}">${title}</a></h3>${date?`<div class="memory-meta">${date}</div>`:''}</div>${comment?`<p class="memory-comment">${comment}</p>`:''}${tagsHtml}<div class="actions"><a class="read-more" href="${detail}">READ MORE</a></div></div></article>`;}
