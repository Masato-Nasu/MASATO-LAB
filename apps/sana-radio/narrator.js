// Use the browser's installed English voices. A device may report none.
const nativeSpeech=window.speechSynthesis;
let activeNarration=null;
nativeSpeech?.getVoices();
function englishVoices(station){
 const voices=nativeSpeech?.getVoices().filter(voice=>/^en([-_]|$)/i.test(voice.lang))||[];
 const nameOf=voice=>voice.name.replace(/[_-]/g,' ');
 const male=/\b(male|alex|daniel|fred|arthur|oliver|tom|reed|ralph|jorge|gordon|mark|david|guy|ryan|eric|christopher|brian|andrew|steffan|aaron|evan|nathan|lee|malcolm)\b/i;
 const female=/\b(female|samantha|zira|jenny|aria|libby|sonia|victoria|karen|moira|ava|allison|serena)\b/i;
 function rank(voice){
  const name=nameOf(voice);
  const gender=male.test(name)&&!female.test(name)?1:female.test(name)?3:0;
  const preference=station===1||station===3?(gender===station?32:gender===0?16:0):0;
  return preference+(/google/i.test(name)?8:0)+(/natural|neural|enhanced|premium/i.test(name)?4:0)+(voice.localService?2:0)+(/^en[-_]US/i.test(voice.lang)?1:0)
 }
 const eligible=station===1?voices.filter(voice=>{
  const name=nameOf(voice);
  return male.test(name)&&!female.test(name)
 }):voices;
 return eligible.sort((a,b)=>rank(b)-rank(a))
}
function waitForEnglishVoices(station){
 const ready=englishVoices(station);
 if(ready.length||!nativeSpeech?.addEventListener)return Promise.resolve(ready);
 return new Promise(resolve=>{
  const timer=setTimeout(finish,1200);
  function finish(){
   clearTimeout(timer);
   nativeSpeech.removeEventListener('voiceschanged',voicesChanged);
   resolve(englishVoices(station))
  }
  function voicesChanged(){if(englishVoices(station).length)finish()}
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
 u.voice=voice;u.lang=voice.lang;u.rate=[.88,.92,.79,.86][station];
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
