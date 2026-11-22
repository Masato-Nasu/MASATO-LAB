// Render a sixteen-bar dub mix with drum and chord sends to a filtered delay.
const SR=22050;
const tau=2*Math.PI;
const frequency=midi=>440*2**((midi-69)/12);

function renderDub(track){
 const stepSeconds=30/track.bpm;
 const framesPerStep=Math.round(stepSeconds*SR);
 const frames=framesPerStep*8*16;
 const out=new Float32Array(frames);
 const delay=new Float32Array(framesPerStep*track.delay);
 const kicks=new Set(track.kicks),skanks=new Set(track.skanks);
 let seed=13917,previousNoise=0,delayFiltered=0;
 let bassPhase=0,bassAge=Infinity,bassHz=0;

 for(let bar=0;bar<16;bar++){
  const chord=track.chords[bar%4],root=track.key+chord;
  const third=(track.minor&&[0,5].includes(chord))?3:4;
  const organ=[0,third,7].map(n=>frequency(root+24+n));
  const drop=bar===7||bar===15;
  for(let step=0;step<8;step++){
   const note=track.bass[step];
   if(note!==null){bassAge=0;bassHz=frequency(root+note)}
   const kick=kicks.has(step)&&!(drop&&step>=6);
   const rim=step===4&&!drop;
   const skank=skanks.has(step)&&!(bar>=8&&bar<12&&step===3)&&!(drop&&step>=5);
   const start=(bar*8+step)*framesPerStep;
   for(let i=0;i<framesPerStep;i++){
    const frame=start+i,t=i/SR;
    seed=(Math.imul(seed,1664525)+1013904223)|0;
    const white=seed/2147483648,bright=(white-previousNoise)*.5;
    previousNoise=white;

    bassPhase=(bassPhase+bassHz/SR)%1;
    const bassEnvelope=Math.min(1,bassAge*95)*Math.exp(-3.4*bassAge);
    const bass=(Math.sin(tau*bassPhase)+.24*Math.sin(tau*bassPhase*2))*.32*bassEnvelope;
    bassAge+=1/SR;
    const attack=Math.min(1,t*160);
    const drum=kick?.29*Math.sin(tau*(49*t+1.2*(1-Math.exp(-28*t))))*Math.exp(-t*15)*attack:0;
    const hat=bright*(step%2?.060:.029)*Math.exp(-t*(step%2?37:54))*attack;
    const snare=rim?(bright*.23+.09*Math.sin(tau*178*t))*Math.exp(-t*25)*attack:0;
    let keys=0;
    if(skank){
     for(const hz of organ)keys+=Math.sin(tau*hz*t)+.38*Math.sin(tau*hz*2*t)+.17*Math.sin(tau*hz*3*t);
     keys*=.061*attack*Math.exp(-t*(bar>=8?11:20))
    }

    const index=frame%delay.length;
    delayFiltered+=.24*(delay[index]-delayFiltered);
    delay[index]=keys*.75+snare*.48+delayFiltered*track.feedback;
    const edge=Math.min(1,frame/(SR*.025),(frames-frame)/(SR*.16));
    out[frame]=Math.tanh((bass+drum+hat+snare+keys+delayFiltered*.78)*1.35)*edge
   }
  }
 }
 return out
}

self.onmessage=({data:track})=>{
 const pcm=renderDub(track);
 self.postMessage({pcm,sampleRate:SR},[pcm.buffer])
};
