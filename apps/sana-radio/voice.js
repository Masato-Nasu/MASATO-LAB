// Samples of a human diphone voice supply consonants and vowels together.
importScripts('voice-bank.js');
const SR=16000;
const units=new WeakMap();
const digits=['zo','in','du','tri','ka','pe','su','ne','ot','vi'];
function sample(key,bank){
 if(!units.has(bank))units.set(bank,new Map());
 const clips=units.get(bank);
 if(!clips.has(key)){
  const bytes=Uint8Array.from(atob(bank[key]),c=>c.charCodeAt(0));
  clips.set(key,new Int16Array(bytes.buffer));
 }
 return clips.get(key)
}
function femaleBank(){
 if(!self.sltLoaded){importScripts('voice-bank-slt.js');self.sltLoaded=true}
 return sltUnits
}
function syllablesFor(word){
 return word.toLowerCase().replace(/\d/g,d=>digits[+d]).match(/(?:sh|ch|ts|[bcdfghjklmnpqrstvwxyz])?[aeiou]|sh|ch|ts|[a-z]/g)||[]
}
function renderVoice(line,station){
 const samples=[],cues=[];
 const bank=station===3?femaleBank():recordedUnits;
 let note=0;
 function silence(t){for(let i=0;i<t*SR;i++)samples.push(0)}
 const words=line.sana.match(/[a-z0-9-]+|[^\s]/gi)||[];
 for(const [j,word] of words.entries()){
  if(!/[a-z0-9]/i.test(word)){silence(word===','?.17:.30);continue}
  cues.push({at:samples.length/SR,word});
  for(const key of syllablesFor(word)){
   if(!bank[key])continue;
   const clip=sample(key,bank);
   const ratio=[1.04,1.02,.94,.97][station]*(1+.045*Math.sin(note++*.95)-.075*j/words.length);
   const n=Math.max(1,Math.floor((clip.length-1)/ratio));
   for(let i=0;i<n;i++){
    const at=i*ratio,k=Math.floor(at),fraction=at-k;
    const val=(clip[k]*(1-fraction)+clip[k+1]*fraction)/32768;
    samples.push(Math.tanh(val*3)*Math.min(1,i/34,(n-i)/42));
   }
  }
  silence(.047);
 }
 return {pcm:Float32Array.from(samples),cues}
}
self.onmessage=({data})=>{
 const result=renderVoice(data.line,data.station);
 self.postMessage(result,[result.pcm.buffer])
};
