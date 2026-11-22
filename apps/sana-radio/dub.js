const harborDub={
 title:'霧の港',bpm:78,key:38,minor:true,chords:[0,0,5,7],
 bass:[0,null,null,7,0,null,12,null],
 kicks:[4],skanks:[1,3,5,7],delay:3,feedback:.42
};
// Minor-key arrangements built around the one-drop and offbeat guitar/organ feel.
const dubProgressions=[[0,0,5,7],[0,5,0,7],[0,0,8,7],[0,10,5,7]];
const recordedDubs=[harborDub,{
 title:'雨上がりの島',bpm:75,key:36,minor:true,chords:dubProgressions[1],
 bass:[0,null,null,7,null,0,null,null],
 kicks:[4],skanks:[1,3,7],delay:3,feedback:.48
},{
 title:'島の夜、海の風',vocal:true,bpm:77,key:39,minor:true,chords:dubProgressions[2],
 bass:[0,null,0,null,null,7,null,12],
 kicks:[4],skanks:[1,3,5,7],delay:2,feedback:.46
}];

function validateDub(track){
 if(!track||typeof track.title!=='string'||!track.title.trim()||track.title.length>60)return false;
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((n,i)=>n===b[i]);
 const bass=track.bass;
 const skanks=track.skanks;
 if(!Array.isArray(bass)||bass.length!==8||bass[0]!==0)return false;
 const attacks=bass.filter(n=>n!==null);
 if(attacks.length<3||attacks.length>5||!attacks.every(n=>[0,7,12].includes(n)))return false;
 if(!Array.isArray(skanks)||skanks.length<2||skanks.length>4||new Set(skanks).size!==skanks.length||
    !skanks.every(n=>[1,3,5,7].includes(n)))return false;
 return integer(track.bpm,73,80)&&integer(track.key,35,41)&&track.minor===true&&
  dubProgressions.some(chords=>same(track.chords,chords))&&same(track.kicks,[4])&&
  integer(track.delay,2,3)&&typeof track.feedback==='number'&&track.feedback>=.38&&track.feedback<=.53;
}

function sameDubGroove(track,previous){
 return !!previous&&['chords','bass','skanks'].every(part=>
  track[part].length===previous[part].length&&track[part].every((n,i)=>n===previous[part][i]));
}

async function generateDub(key,previous,signal){
 const deadline=AbortSignal.timeout(45000);
 const response=await fetch('https://api.openai.com/v1/chat/completions',{
  method:'POST',signal:signal?AbortSignal.any([deadline,signal]):deadline,
  headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},messages:[
   {role:'system',content:'Arrange an original instrumental sufferers reggae dub with island melancholy: dusk over a small island, restrained dynamics, deep bass, small offbeat chords and a long space between notes. Use the reference as a fixed musical direction. Return JSON only: title (short Japanese), bpm (73–80), key (MIDI 35–41), minor (true), chords (one of '+JSON.stringify(dubProgressions)+'), bass (8 eighth-note slots starting at 0, with 3–5 total attacks, each 0, 7, or 12, and null for rests), kicks ([4]), skanks (2–4 distinct picks from [1,3,5,7], ascending), delay (2 or 3), feedback (0.38–0.53). Keep the reggae one-drop and minor harmony. No vocals or lyrics.'},
   {role:'user',content:'Fixed reference: '+JSON.stringify(harborDub)+'. Vary the bass rhythm, chord movement, or offbeats relative to the last track while retaining the same feel. Last track: '+JSON.stringify(previous)}
  ]})
 });
 if(!response.ok)throw Error('OpenAI HTTP '+response.status);
 const data=await response.json();
 const track=JSON.parse(data.choices[0].message.content);
 if(!validateDub(track))throw Error('編曲がマイナーDUBの範囲を外れました');
 if(sameDubGroove(track,previous))throw Error('前の曲と同じ編曲になりました');
 // Keep the same original SANA chorus available in some new arrangements.
 return {...track,vocal:!previous?.vocal&&Math.random()<.35}
}

function composeLocalDub(previous){
 const pick=choices=>choices[Math.floor(Math.random()*choices.length)];
 const bass=Array(8).fill(null);
 bass[0]=0;
 const slots=[1,2,3,4,5,6,7];
 for(let count=pick([2,3,4]);count>0;count--){
  const index=Math.floor(Math.random()*slots.length);
  bass[slots.splice(index,1)[0]]=pick([0,7,12])
 }
 const places=['桟橋','入江','灯台','浜辺','水平線','波止場'];
 const moods=['夜明けの','月影の','雨に煙る','夕暮れの','遠い','風待ちの'];
 const titles=moods.flatMap(mood=>places.map(place=>mood+place)).filter(title=>title!==previous.title);
 return {
  title:pick(titles),bpm:pick([73,74,75,76,77,78,79,80]),minor:true,
  key:pick([35,36,37,38,39,40,41]),bass,kicks:[4],
  chords:pick(dubProgressions.filter(chords=>String(chords)!==String(previous.chords))),
  skanks:pick([[1,3,5,7],[1,5,7],[3,5,7],[1,3,7]]),
  delay:pick([2,3]),feedback:pick([.4,.43,.46,.49,.52]),
  vocal:!previous.vocal&&Math.random()<.35
 }
}
