const harborDub={
 title:'霧の港',bpm:78,key:38,minor:true,chords:[0,0,5,7],
 bass:[0,null,null,7,0,null,12,null],
 kicks:[4],skanks:[1,3,5,7],delay:3,feedback:.42
};
let currentDub=harborDub;

function validateDub(track){
 if(!track||typeof track.title!=='string'||!track.title.trim()||track.title.length>60)return false;
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 const notes=(a,length,max)=>Array.isArray(a)&&a.length===length&&a.every(n=>integer(n,0,max));
 const hits=a=>Array.isArray(a)&&a.length>=1&&a.length<=8&&new Set(a).size===a.length&&a.every(n=>integer(n,0,7));
 return integer(track.bpm,62,96)&&integer(track.key,34,43)&&typeof track.minor==='boolean'&&
  notes(track.chords,4,11)&&Array.isArray(track.bass)&&track.bass.length===8&&
  track.bass.some(n=>n!==null)&&track.bass.every(n=>n===null||integer(n,0,12))&&
  hits(track.kicks)&&hits(track.skanks)&&integer(track.delay,1,4)&&
  typeof track.feedback==='number'&&track.feedback>=.2&&track.feedback<=.65;
}

async function generateDub(key,previous,signal){
 const deadline=AbortSignal.timeout(45000);
 const response=await fetch('https://api.openai.com/v1/chat/completions',{
  method:'POST',signal:signal?AbortSignal.any([deadline,signal]):deadline,
  headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},messages:[
   {role:'system',content:'Arrange an original instrumental Jamaican dub track. Return JSON only, with title (short Japanese title), bpm (integer 62–96), key (MIDI integer 34–43), minor (boolean), chords (four root intervals in semitones 0–11 relative to key), bass (eight eighth-note slots, each null for no new attack or integer 0–12 semitones above the chord root), kicks and skanks (arrays of distinct eighth-note slot indices 0–7), delay (integer 1–4 eighth notes), feedback (0.2–0.65). Use a syncopated bass motif with space, skank chords mostly on offbeats, and a one-drop or steppers beat. No lyrics.'},
   {role:'user',content:'Compose a fresh dub arrangement distinct from this previous one: '+JSON.stringify(previous)}
  ]})
 });
 if(!response.ok)throw Error('OpenAI HTTP '+response.status);
 const data=await response.json();
 const track=JSON.parse(data.choices[0].message.content);
 if(!validateDub(track))throw Error('編曲データの形式が合いません');
 return track
}
