// A syllabic SANA chorus built from voice samples and pitched to the dub's key.
importScripts('voice-bank-slt.js');

// 島の夜。海の風。 / mashiro no ruyoro. miuro no zekaro.
const islandChorus=[
 [0,'ma',7],[1,'shi',10],[2,'ro',12],[4,'no',10],
 [6,'ru',7],[7,'yo',5],[8,'ro',7,3],
 [16,'mi',7],[17,'u',10],[18,'ro',12],[20,'no',10],
 [22,'ze',7],[23,'ka',5],[24,'ro',3,3]
];

function voiceClip(unit){
 const bytes=Uint8Array.from(atob(sltUnits[unit]),c=>c.charCodeAt(0));
 return new Int16Array(bytes.buffer)
}

function vowelCycle(vowel){
 const clip=voiceClip(vowel);
 const from=Math.floor(clip.length*.42);
 let period=80,best=-1;
 for(let lag=45;lag<=150;lag++){
  let dot=0,aa=0,bb=0;
  for(let i=from;i<Math.min(from+420,clip.length-lag);i++){
   const a=clip[i],b=clip[i+lag];
   dot+=a*b;aa+=a*a;bb+=b*b
  }
  const score=dot/Math.sqrt(aa*bb||1)-lag*.0004;
  if(score>best){best=score;period=lag}
 }
 const cycle=Float32Array.from({length:period},(_,i)=>{
  const a=clip[from+i],b=clip[from+period+i];
  return (a+(b-a)*i/period)/32768
 });
 const mean=cycle.reduce((sum,n)=>sum+n,0)/period;
 const peak=Math.max(.015,...cycle.map(n=>Math.abs(n-mean)));
 return cycle.map(n=>(n-mean)/peak)
}

function renderIslandChorus(track,framesPerStep,frames,sampleRate){
 const vocal=new Float32Array(frames);
 const cycles=new Map();
 // Leave the first four bars to the band and the last four to the echo.
 for(const firstBar of [4,8]){
  for(const [step,syllable,degree,length=1] of islandChorus){
   const vowel=syllable.at(-1);
   if(!cycles.has(vowel))cycles.set(vowel,vowelCycle(vowel));
   const cycle=cycles.get(vowel);
   const onset=voiceClip(syllable in sltUnits?syllable:vowel);
   const start=(firstBar*8+step)*framesPerStep;
   const duration=Math.round(framesPerStep*length*.84);
   const hz=440*2**((track.key+24+degree-69)/12);
   let phase=0;
   for(let i=0;i<duration;i++){
    const t=i/sampleRate;
    const vibrato=Math.min(1,Math.max(0,(t-.15)*8));
    phase=(phase+hz*(1+.009*vibrato*Math.sin(2*Math.PI*5.1*t))/sampleRate)%1;
    const index=phase*cycle.length,lo=Math.floor(index);
    const sung=cycle[lo]+(cycle[(lo+1)%cycle.length]-cycle[lo])*(index-lo);
    const attackSample=onset[Math.floor(t*16000)]||0;
    const blend=syllable.length===1?1:Math.min(1,Math.max(0,(t-.035)*19));
    const envelope=Math.min(1,t*100,(duration-i)/(sampleRate*.075));
    vocal[start+i]+=(sung*.12*blend+attackSample/32768*.16*(1-blend))*envelope
   }
  }
 }
 return vocal
}
