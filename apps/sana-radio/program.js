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
async function program(s,nextBulletin){
 if(s<3&&nextBulletin)return {label:['架空ニュース · 新着','架空気象情報 · 新着','真夜中の通信室'][s],lines:nextBulletin};
 if(s===0)return fictionalProgram(newsEditions,indices[0],'架空ニュース · ');
 if(s===1)return fictionalProgram(weatherEditions,indices[1],'架空気象情報 · ');
 if(s===2){
  const editions=(await demo)[s];
  const editionIndex=indices[s]%editions.length;
  return {label:'真夜中の通信室',editionIndex,lines:editions[editionIndex]}
 }
 const articles=await (await read('memory.json')).json();
 const {article,played}=nextArticle(articles);
 return {...article,played,lines:await translate(article.lines)}
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
  const translated=await translate(items.map(item=>item.ja.trim()));
  const failed=translated.filter(line=>!line.sana||/\b(?:jpx|khx|kpx|lit)-|[\u3040-\u30ff\u3400-\u9fff]/i.test(line.sana));
  if(!failed.length)return translated.map((line,i)=>({...line,en:items[i].en.trim()}));
  messages.push({role:'assistant',content},{role:'user',content:'次の文は辞書にない語を含んでいました。簡単な日常語で言い換え、英訳も直した原稿全体を同じJSON形式で返してください。'+JSON.stringify(failed.map(line=>line.ja))});
 }
 throw Error('SANA語辞書で変換できる原稿を作れませんでした')
}
