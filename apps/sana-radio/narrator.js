// Use the browser's installed English voices. A device may report none.
const nativeSpeech=window.speechSynthesis;
let activeNarration=null;
nativeSpeech?.getVoices();
const nameOf=voice=>voice.name.replace(/[_-]/g,' ');
const male=/\b(male|alex|daniel|fred|arthur|oliver|tom|reed|ralph|jorge|gordon|mark|david|guy|ryan|eric|christopher|brian|andrew|steffan|aaron|evan|nathan|lee|malcolm)\b/i;
const female=/\b(female|samantha|zira|jenny|aria|libby|sonia|victoria|karen|moira|ava|allison|serena)\b/i;
const basicVoice=/\b(fred|compact|robotic|espeak|whisper|zarvox|bubbles|trinoids)\b/i;
function voiceGender(voice){
 const name=nameOf(voice);
 return female.test(name)?3:male.test(name)?1:0
}
function englishVoices(station){
 const voices=nativeSpeech?.getVoices().filter(voice=>/^en([-_]|$)/i.test(voice.lang))||[];
 function rank(voice){
  const name=nameOf(voice);
  const gender=voiceGender(voice);
  const preferred=station===1||station===3?station:0;
  const preference=station===1?(gender===1?128:gender===3?64:0)
   :preferred?(gender===preferred?32:gender===0?16:0):0;
  const accent=voice.lang.replace('_','-').toLowerCase()===voiceAccent.toLowerCase()?16:0;
  const quality=/natural|neural|enhanced|premium/i.test(name)?12:0;
  const basic=basicVoice.test(name)?-24:0;
  return preference+accent+quality+basic+(/google/i.test(name)?6:0)+(voice.localService?2:0)
 }
 const eligible=station===1?voices.filter(voice=>!basicVoice.test(nameOf(voice))):voices;
 return eligible.sort((a,b)=>rank(b)-rank(a))
}
function waitForEnglishVoices(station){
 const ready=englishVoices(station);
 const hasPreferred=voices=>station===1?voices.some(voice=>voiceGender(voice)===1):voices.length>0;
 if(hasPreferred(ready)||!nativeSpeech?.addEventListener)return Promise.resolve(ready);
 return new Promise(resolve=>{
  const timer=setTimeout(finish,1200);
  function finish(){
   clearTimeout(timer);
   nativeSpeech.removeEventListener('voiceschanged',voicesChanged);
   resolve(englishVoices(station))
  }
  function voicesChanged(){if(hasPreferred(englishVoices(station)))finish()}
  nativeSpeech.addEventListener('voiceschanged',voicesChanged)
 })
}
function endNarration(){
 if(!activeNarration)return;
 const {utterance,timer}=activeNarration;
 clearTimeout(timer);clearInterval(activeNarration.progress);activeNarration=null;
 utterance.onstart=utterance.onend=utterance.onerror=utterance.onboundary=null;
 nativeSpeech.cancel()
}
function narrate(line,station,voice,advance,recover){
 const text=line.sana.replace(/-/g,' ');
 const words=[...line.sana.matchAll(/[a-z0-9-]+/gi)];
 const u=new SpeechSynthesisUtterance(text);
 u.voice=voice;u.lang=voice.lang;u.rate=[.88,.96,.79,.86][station];
 u.pitch=[1,1,.92,.98][station];u.volume=(+$('volume').value/100)**1.4;
 const state=activeNarration={utterance:u,timer:null,progress:null};
 function failed(){
  if(activeNarration!==state)return;
  endNarration();recover()
 }
 u.onstart=()=>{
  if(activeNarration!==state)return;
  clearTimeout(state.timer);showLine(line);glyph(words[0]?.[0]||'');
  // Some network voices expose start/end but omit word-boundary events.
  const start=performance.now(),secondsPerChar=.072/u.rate;
  state.progress=setInterval(()=>{
   const position=(performance.now()-start)/1000/secondsPerChar;
   const w=words.findLast(w=>w.index<=position);if(w)glyph(w[0])
  },75);
  state.timer=setTimeout(failed,Math.max(15000,text.length*350))
 };
 u.onboundary=e=>{
  if(activeNarration!==state)return;
  if(e.name!=='word')return;clearInterval(state.progress);
  const w=words.findLast(w=>w.index<=e.charIndex);
  if(w)glyph(w[0])
 };
 u.onerror=failed;
 u.onend=()=>{if(activeNarration!==state)return;clearTimeout(state.timer);clearInterval(state.progress);activeNarration=null;advance()};
 state.timer=setTimeout(failed,3500);
 try{nativeSpeech.speak(u)}catch{failed()}
}

async function synthesizeWeather(line,key,accent,signal){
 const dialect=accent==='en-GB'?'British English':'American English';
 const response=await fetch('https://api.openai.com/v1/audio/speech',{
  method:'POST',
  signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),
  headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({
   model:'gpt-4o-mini-tts',voice:'onyx',response_format:'mp3',
   input:line.sana,
   instructions:'Read the supplied SANA words without translating, adding or spelling out letters. Use the rhythm of a calm male radio weather presenter speaking '+dialect+'. Pronounce the vowels consistently and clearly, use light stress, and connect parts joined by hyphens. Brief pauses at commas; finish the sentence naturally.'
  })
 });
 if(!response.ok)throw Error('Audio HTTP '+response.status);
 return response.arrayBuffer()
}
