// Shape complete voice samples into the chorus with pitch-synchronous overlap.
importScripts('voice-bank-slt.js');

const vocalSampleRate=16000;
const islandChorus=[
 [0,'ma',7],[1,'shi',10],[2,'ro',12],[4,'no',10],
 [6,'ru',7],[7,'yo',5],[8,'ro',7,3],
 [16,'mi',7],[17,'u',10],[18,'ro',12],[20,'no',10],
 [22,'ze',7],[23,'ka',5],[24,'ro',3,3]
];

function voiceClip(unit){
 const bytes=Uint8Array.from(atob(sltUnits[unit]),c=>c.charCodeAt(0));
 return Float32Array.from(new Int16Array(bytes.buffer),n=>n/32768)
}

function analyseVoice(clip){
 const voiced=[];
 for(let center=240;center<clip.length-240;center+=80){
  let period=80,best=0;
  let power=0;
  for(let i=center-100;i<center+100;i++)power+=clip[i]**2;
  if(power<.04)continue;
  for(let lag=44;lag<=128;lag++){
   let dot=0,nextPower=0;
   for(let i=center-100;i<center+100;i++){
    const next=clip[i+lag];
    dot+=clip[i]*next;
    nextPower+=next*next
   }
   const score=dot/Math.sqrt(power*nextPower||1)-lag*.0014;
   if(score>best){best=score;period=lag}
  }
  if(best<.59)continue;
  let peak=center;
  for(let i=center-Math.floor(period/2);i<center+Math.floor(period/2);i++){
   if(clip[i]>clip[peak])peak=i
  }
  voiced.push({peak,period})
 }
 return voiced
}

function sampleVoice(clip,index){
 const i=Math.floor(index);
 return (clip[i]||0)+((clip[i+1]||0)-(clip[i]||0))*(index-i)
}

function singNote(clip,marks,duration,hz,sampleRate){
 const note=new Float32Array(duration);
 const weight=new Float32Array(duration);
 const scale=vocalSampleRate/sampleRate;
 const first=marks[0]?.peak??1400;
 const attack=Math.min(Math.round(sampleRate*.13),Math.round(first/scale));
 const fade=Math.round(sampleRate*.028);
 const lastMark=Math.max(0,marks.length-1);
 const sungFrames=Math.max(1,duration-attack);
 // Spread the source's voiced sections across the note while keeping each grain's spectrum.
 for(let pulse=attack;pulse<duration&&marks.length;){
  const progress=(pulse-attack)/sungFrames;
  const mark=marks[Math.min(lastMark,Math.round(progress*lastMark))];
  const radius=Math.min(Math.round(mark.period*1.6/scale),Math.floor(sampleRate*.015));
  for(let j=-radius;j<=radius;j++){
   const dest=Math.round(pulse)+j;
   if(dest<0||dest>=duration)continue;
   const w=.5+.5*Math.cos(Math.PI*j/radius);
   note[dest]+=sampleVoice(clip,mark.peak+j*scale)*w;
   weight[dest]+=w
  }
  const t=(pulse-attack)/sampleRate;
  const scoop=-.025*Math.exp(-t*24);
  const vibrato=.011*Math.min(1,t*3)*Math.sin(2*Math.PI*5.1*t);
  pulse+=sampleRate/(hz*(1+scoop+vibrato))
 }
 for(let i=0;i<duration;i++){
  const opening=Math.min(1,Math.max(0,(attack+fade-i)/fade));
  const original=sampleVoice(clip,i*scale);
  const sustained=weight[i]>.015?note[i]/Math.max(1,weight[i]):0;
  const sung=marks.length?original*opening+sustained*(1-opening):original;
  const envelope=Math.min(1,i/(sampleRate*.013),(duration-i)/(sampleRate*.065));
  note[i]=sung*envelope
 }
 return note
}

function renderIslandChorus(track,framesPerStep,frames,sampleRate){
 const vocal=new Float32Array(frames);
 const clips=new Map();
 // 島の夜。海の風。 / mashiro no ruyoro. miuro no zekaro.
 for(const firstBar of [4,8]){
  for(const [step,syllable,degree,length=1] of islandChorus){
   if(!clips.has(syllable)){
    const clip=voiceClip(syllable in sltUnits?syllable:syllable.at(-1));
    clips.set(syllable,{clip,marks:analyseVoice(clip)})
   }
   const {clip,marks}=clips.get(syllable);
   const start=(firstBar*8+step)*framesPerStep;
   const duration=Math.round(framesPerStep*length*(length===1?.98:.88));
   const hz=440*2**((track.key+12+degree-69)/12);
   const note=singNote(clip,marks,duration,hz,sampleRate);
   for(let i=0;i<duration;i++){
    vocal[start+i]+=Math.tanh(note[i]*1.7)*.28
   }
  }
 }
 return vocal
}
