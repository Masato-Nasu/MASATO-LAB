async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(9500)});if(!r.ok)throw Error();return r}
async function fictionalProgram(editions,index,prefix){
 const editionIndex=index%editions.length;
 const edition=editions[editionIndex];
 const lines=await translate(edition.items.map(([ja])=>ja));
 return {label:prefix+edition.label,editionIndex,lines:lines.map((line,i)=>({...line,en:edition.items[i][1]}))}
}
// Exhaust a shuffled article list before repeating one, including across visits.
let memoryHistory={};
try{memoryHistory=JSON.parse(localStorage.getItem('sana-memory-rotation')||'{}')||{}}catch{}
function nextArticle(articles){
 const played=Array.isArray(memoryHistory.played)?memoryHistory.played:[];
 const unread=articles.filter(article=>!played.includes(article.url));
 const eligible=(unread.length?unread:articles).filter(article=>article.url!==memoryHistory.last);
 const otherArticles=articles.filter(article=>article.url!==memoryHistory.last);
 const pool=eligible.length?eligible:otherArticles.length?otherArticles:articles;
 const article=pool[Math.floor(Math.random()*pool.length)];
 return {article,played:eligible.length&&unread.length?played:[]}
}
function rememberArticle(url,played){
 memoryHistory={last:url,played:[...played,url]};
 try{localStorage.setItem('sana-memory-rotation',JSON.stringify(memoryHistory))}catch{}
}
// Pronounce lexical chunks and kana readings, omitting reversible encoding markers.
function memorySpeech(sana){
 return sana.split(/\s+/).map(token=>{
  const [,word,punctuation]=token.match(/^([^.,!?]*)([.,!?]*)$/)||['',token,''];
  if(/^kkx-/i.test(word)){
   const reading=word.slice(4).split('-').map(unit=>unit==='long'||unit==='xtu'?'':unit.replace(/^x(?=[yauioe])/,'')).join('');
   return reading+punctuation
  }
  if(/^kh-|^kk-/i.test(word))return word.slice(3).replaceAll('-','')+punctuation;
  if(/^lit-(?:[a-f0-9]{2})+$/i.test(word)){
   const literal=String.fromCharCode(...word.slice(4).match(/../g).map(hex=>parseInt(hex,16)));
   return (/^[A-Za-z0-9]+$/.test(literal)?literal:'')+punctuation
  }
  if(/^(?:jpx|khx|kpx)-|^(?:sp|fwsp|nl|choon|middot|ndashuaro|emdash|hbar|ellipsis|j[qd]?q(?:open|close)|[a-z]*paren(?:open|close))$/i.test(word))return punctuation;
  return token
 }).filter(Boolean).join(' ').replace(/\s+([.,!?])/g,'$1')
}
const midnightParts=[
 [
  ['東の丘から手紙が届きました。','A letter has arrived from the eastern hill.'],
  ['今夜は港の窓を開けて放送しています。','Tonight the studio window is open to the harbor.'],
  ['南の島では、まだ明かりが見えます。','There are still lights on the southern island.'],
  ['こんばんは。雨が止むまで、ここで話しましょう。','Good evening. Let us talk here until the rain stops.'],
  ['さっき、最後の船が出ていきました。','The last boat left a little while ago.']
 ],[
  ['机の上に白い石が一つあります。','There is a single white stone on the desk.'],
  ['古い時計が一度だけ鳴りました。','An old clock rang just once.'],
  ['夜の風が紙の端を揺らしています。','The night breeze is lifting the edge of the paper.'],
  ['お茶を入れたのに、飲むのを忘れていました。','I made tea and forgot to drink it.'],
  ['誰もいない道を、猫が横切りました。','A cat crossed the empty road.']
 ],[
  ['静かになると、小さな音が近くなりますね。','When it grows quiet, small sounds seem nearer.'],
  ['昼間なら、気づかずにいたと思います。','In daylight I think I would have missed it.'],
  ['こんな夜には、昔の友達を思い出します。','On nights like this I remember an old friend.'],
  ['少し黙って、一緒に耳を澄ませてみましょう。','Let us pause a moment and listen together.'],
  ['そちらでは今、何が聞こえますか。','What can you hear where you are?']
 ],[
  ['このあとは、波が引くまで起きています。','I will stay up until the tide goes out.'],
  ['眠れない方は、もう少しお付き合いください。','If sleep has not come, keep me company a little longer.'],
  ['明日の朝、この夜を少しだけ覚えていたいですね。','I hope we remember a little of this night in the morning.'],
  ['窓の向こうの皆さんに、おやすみを。','Good night to all of you beyond the window.'],
  ['手紙の続きは、次の夜に読みましょう。','Let us read the rest of the letter another night.']
 ]
];
let midnightSequence;
function nextMidnightLines(){
 if(midnightSequence===undefined){
  let stored=null;
  try{stored=localStorage.getItem('sana-midnight-sequence')}catch{}
  midnightSequence=stored!==null&&/^\d+$/.test(stored)?Number(stored)%625:Math.floor(Math.random()*625)
 }
 // Walk every combination once. The stride is coprime to 5^4.
 midnightSequence=(midnightSequence+183)%625;
 try{localStorage.setItem('sana-midnight-sequence',String(midnightSequence))}catch{}
 let index=midnightSequence;
 return midnightParts.map(group=>{
  const pair=group[index%group.length];
  index=Math.floor(index/group.length);
  return pair
 })
}
async function midnightProgram(){
 const pairs=nextMidnightLines();
 const lines=await translate(pairs.map(([ja])=>ja));
 return {label:'真夜中の通信室',lines:lines.map((line,i)=>({...line,sana:memorySpeech(line.sana),en:pairs[i][1]}))}
}
async function program(s,nextBulletin){
 if(s<3&&nextBulletin)return {label:['架空ニュース · 新着','架空気象情報 · 新着','真夜中の通信室'][s],lines:nextBulletin};
 if(s===0)return fictionalProgram(newsEditions,indices[0],'架空ニュース · ');
 if(s===1)return fictionalProgram(weatherEditions,indices[1],'架空気象情報 · ');
 if(s===2)return midnightProgram();
 const articles=await (await read('memory.json')).json();
 const {article,played}=nextArticle(articles);
 const spokenJapanese=article.lines.map(line=>line
  .replace(/State of Mind/gi,'心の状態')
  .replace(/Ouroboros Mobius Ring/gi,'ウロボロスメビウスリング')
  .replace(/ネオ・ダダ/g,'ネオダダ')
  .replace(/ハイレッド・センター/g,'ハイレッドセンター'));
 const lines=await translate(spokenJapanese);
 return {...article,played,lines:lines.map((line,i)=>({...line,ja:article.lines[i],sana:memorySpeech(line.sana)}))};
}

async function generateBulletin(station,key,previous,signal){
 const weather=station===1;
 const format=weather
  ? '北の港、東の丘、南の島の順に、一文ずつ天気を伝える。朝、昼、夕方、夜から時間を選び、天気や風や波を平易な言葉で述べる。'
  : station===2
   ? '夜の静かな独白や不思議な手紙を、深夜ラジオのように三〜五文で語る。'
   : '北の港、東の丘、南の島のいずれかで起きた新しい出来事を、短いニュースとして三〜五文で伝える。港や島の人の暮らしに目を向ける。';
 const messages=[
  {role:'system',content:'架空世界の放送原稿を書く。'+format+' 日本語原稿は一文五十字以内。英数字、現実の固有名詞、新しい地名、専門用語を避ける。JSONオブジェクトの items 配列を返す。各要素は日本語の ja と、その文を英訳した en の二つの文字列を持つ。'},
  {role:'user',content:'新しい放送を作ってください。'+(previous?' 前回の原稿と出来事や天気を変えてください。前回の原稿: '+JSON.stringify(previous.map(line=>line.ja)):'')}
 ];
 for(let attempt=0;attempt<2;attempt++){
  signal?.throwIfAborted();
  const deadline=AbortSignal.timeout(30000);
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',signal:signal?AbortSignal.any([signal,deadline]):deadline,
   headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},messages})
  });
  if(!response.ok)throw Error('OpenAI HTTP '+response.status);
  const result=await response.json();
  const content=result.choices[0].message.content;
  const {items}=JSON.parse(content);
  if(!Array.isArray(items)||items.length<3||items.length>(weather?3:5)||
   !items.every(item=>typeof item?.ja==='string'&&item.ja.trim()&&item.ja.length<=70&&typeof item.en==='string'&&item.en.trim()&&item.en.length<=240)){
   throw Error('原稿の形式が合いません')
  }
  if(station===2&&previous&&items.some(item=>previous.some(line=>line.ja===item.ja.trim())))continue;
  const translated=await translate(items.map(item=>item.ja.trim()));
  const failed=translated.filter(line=>!line.sana||/\b(?:jpx|khx|kpx|lit)-|[\u3040-\u30ff\u3400-\u9fff]/i.test(line.sana));
  if(!failed.length)return translated.map((line,i)=>({...line,en:items[i].en.trim()}));
  messages.push({role:'assistant',content},{role:'user',content:'次の文は辞書にない語を含んでいました。簡単な日常語で言い換え、英訳も直した原稿全体を同じJSON形式で返してください。'+JSON.stringify(failed.map(line=>line.ja))});
 }
 throw Error('SANA語辞書で変換できる原稿を作れませんでした')
}
