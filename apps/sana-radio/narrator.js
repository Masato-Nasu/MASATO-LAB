// Use the browser's installed English voices. A device may report none.
const nativeSpeech=window.speechSynthesis;
let activeNarration=null;
nativeSpeech?.getVoices();
function englishVoice(station){
 const voices=nativeSpeech?.getVoices().filter(v=>/^en([-_]|$)/i.test(v.lang))||[];
 const score=v=>(/google/i.test(v.name)?8:0)+(/natural|neural|enhanced|premium/i.test(v.name)?4:0)+(/^en[-_]US/i.test(v.lang)?2:0);
 if(station===1){
  const male=/\b(male|alex|daniel|fred|arthur|oliver|tom|reed|ralph|jorge|gordon|mark|david|guy|ryan|eric|christopher|brian|andrew|steffan)\b/i;
  return voices.filter(v=>male.test(v.name)&&!/\bfemale\b/i.test(v.name)).sort((a,b)=>score(b)-score(a))[0]
 }
 if(station===3)return voices.filter(v=>/female|samantha|zira|jenny|aria|libby|sonia|victoria|karen|moira|ava|allison|serena/i.test(v.name)&&!/male\b/i.test(v.name.replace(/female/ig,''))).sort((a,b)=>score(b)-score(a))[0];

 return voices.sort((a,b)=>score(b)-score(a))[0]
}
function waitForEnglishVoice(station){
 const ready=englishVoice(station);
 if(ready||!nativeSpeech?.addEventListener||nativeSpeech.getVoices().length)return Promise.resolve(ready);
 return new Promise(resolve=>{
  const timer=setTimeout(finish,800);
  function finish(){
   clearTimeout(timer);
   nativeSpeech.removeEventListener('voiceschanged',finish);
   resolve(englishVoice(station))
  }
  nativeSpeech.addEventListener('voiceschanged',finish)
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
 nativeSpeech.speak(u)
}
