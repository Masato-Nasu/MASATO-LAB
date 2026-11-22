const G_SEG={
  T:[28,16,72,16], UL:[16,16,48,48], UR:[84,16,52,48],
  LL:[16,84,48,52], LR:[84,84,52,52], B:[28,84,72,84]
};
const G_ORDER=["T","UL","UR","LL","LR","B"];
const SEG_ALPHABET_VERSION="alphabet-v3";
// alphabet-v3: 区切り記号「-」は T+UL+LR の固有マスク。
// 数字「1」(UR+LL)とは6ビット中5ビット異なり、画像だけで決定的に識別できる。
const SANA_SEPARATOR_SEGMENTS=Object.freeze(["T","UL","LR"]);
const SANA_FONT={
  a:["T","UL","UR","LR"], b:["UL","LL","LR","B"], c:["T","UL","LL","B"], d:["T","UR","LR"],
  e:["T","UL","B"], f:["T","UL"], g:["T","UL","LL","LR","B"], h:["UL","LL","LR"], i:["T","B"],
  j:["UR","B"], k:["UL","UR","LL"], l:["LL","B"], m:["UL","UR","LR"], n:["UL","LR"],
  o:["T","UL","UR","B"], p:["T","UL","UR","LL","B"], q:["T","UL","UR","LR","B"], r:["UL","UR","LL","B"],
  s:["T","LR","B"], t:["T","LL"], u:["LL","LR","B"], v:["LL","LR"], w:["UL","UR","LL","LR","B"],
  x:["UL","UR","LL","LR"], y:["UL","UR","LR","B"], z:["T","UR","B"],
  "0":["T","UL","UR"], "1":["UR","LL"], "2":["T","UR","LL","B"], "3":["T","UR","LR","B"],
  "4":["T","UL","UR","LL","LR"], "5":["T","UL","LR","B"], "6":["UR","LL","LR","B"], "7":["T","UR","LL"],
  "8":["T","UL","UR","LL","LR","B"], "9":["T","UL","UR","LL"],
  ".":["B"], ",":["UL"], "!":["LR","B"], "?":["LL"], ":":["UR"], ";":["UR","LR"],
  "-":SANA_SEPARATOR_SEGMENTS, "_":["B"], "/":["UL","B"], "|":["UL","LR"]
};
function glyphSVG(ch){
  const segs=SANA_FONT[ch]; if(!segs) return "";
  const set=new Set(segs);
  const lines=G_ORDER.map(nm=>{ const s=G_SEG[nm];
    return `<line class="${set.has(nm)?'on':'off'}" x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}"/>`;
  }).join("");
  return `<svg class="glyph" viewBox="0 0 100 100" role="img" aria-label="${ch}">${lines}</svg>`;
}
const SAFE_SEG_LIMIT=180;
function renderSeg(el,str){
  if(!el)return;
  const chars=[...str.toLowerCase()],shown=chars.slice(0,SAFE_SEG_LIMIT);
  el.innerHTML=shown.map(ch=>ch===" "?`<span class="sp"></span>`:(SANA_FONT[ch]!==undefined?glyphSVG(ch):"")).join("")+
    (chars.length>shown.length?`<div class="safe-note">6セグ表示はChrome保護のため先頭${SAFE_SEG_LIMIT}文字までです（全文${chars.length}文字）。</div>`:"");
}
