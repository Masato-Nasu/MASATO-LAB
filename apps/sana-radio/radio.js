'use strict';
const $=id=>document.getElementById(id);
const stations=[
 {name:'SANA NEWS',f:6100,icon:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M6 8h5v5H6zM14 8h4m-4 4h4M6 16h12"/>',format:'架空世界の日々の出来事を淡々と報じるニュース'},
 {name:'SANA WEATHER',f:7850,icon:'<path d="M7 18a4 4 0 1 1 1-7.9 6 6 0 0 1 11 3A2.6 2.6 0 0 1 18 18Z"/><path d="M5 3v3m-4 2 2 1m5-5L7 6"/>',format:'天候と風向きが地理的につながる短い気象情報'},
 {name:'SANA MIDNIGHT',f:9640,icon:'<path d="M18.8 16.9A8 8 0 0 1 8 5a8.6 8.6 0 1 0 10.8 11.9Z"/><path d="M17 3v5m-2.5-2.5h5"/>',format:'夜の静かな独白、奇妙な手紙、素朴な哲学の問い'},
 {name:'PERIPHERAL MEMORY',f:8610,icon:'<path d="M3 5q5-2 9 1 5-3 9-1v14q-6-2-9 1-4-3-9-1zM12 6v14"/>'},
 {name:'SANA MUSIC',f:7020,icon:'<path d="M8 17V6l11-3v11M8 9l11-3"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="14" r="2"/>'}];
let freq=6100,station=0,on=false,sub=true,audio,master,meter,hiss,hissGain,filter,source,epoch=0,voiceWorker,frameInfo,wordIndex=-1,engine,apiKey='';
let nextProgramController=null,weatherVoiceController=null;
let voiceAccent='en-GB',weatherAiVoice=false,weatherAiUnavailable=false;
let resumeSpeech=null, restartNativeSpeech=null;
let screenLock=null, screenLockPending=false;
let lastCaption='',lastGlyph='';
const lastEditions=[-1,-1,-1,-1,-1];
try{
 apiKey=localStorage.getItem('sana-radio-key')||'';
 voiceAccent=localStorage.getItem('sana-radio-voice-accent')==='en-US'?'en-US':'en-GB';

 const saved=JSON.parse(localStorage.getItem('sana-radio-last-editions')||'[]');
 for(const index of [0,1,2,4]){
  if(Number.isSafeInteger(saved?.[index])&&saved[index]>=0&&saved[index]<10000)lastEditions[index]=saved[index]
 }
}catch{}
const indices=lastEditions.map(index=>index+1);
let currentDub=recordedDubs[indices[4]%recordedDubs.length];

function rememberEdition(station,index){
 lastEditions[station]=index;
 try{localStorage.setItem('sana-radio-last-editions',JSON.stringify(lastEditions))}catch{}
}
const demo=fetch('demos.json').then(r=>{if(!r.ok)throw Error();return r.json()});
function message(s){$('message').textContent=s}
function glyph(s){if(s!==lastGlyph){renderSeg($('glyphs'),s);lastGlyph=s}}
function caption(s){lastCaption=s;$('caption').textContent=sub?s:'字幕はオフです。'}
function presetUI(){
 $('presets').innerHTML=stations.map((s,i)=>'<button class="sta" aria-pressed="'+(station===i)+'"><i><svg viewBox="0 0 24 24" aria-hidden="true">'+s.icon+'</svg></i><span><b>'+s.name+'</b><small>'+(s.f/1000).toFixed(3)+' MHz</small></span></button>').join('');
 [...$('presets').children].forEach((b,i)=>b.onclick=()=>tuning(stations[i].f))
}
function stopVoice(){epoch++;resumeSpeech=null;restartNativeSpeech=null;nextProgramController?.abort();nextProgramController=null;weatherVoiceController?.abort();weatherVoiceController=null;endNarration();voiceWorker?.terminate();voiceWorker=null;if(source){source.onended=null;try{source.stop()}catch{}source.disconnect();source=null}frameInfo=null;wordIndex=-1}
async function initAudio(){
 if(!audio){
 audio=new AudioContext(); master=audio.createGain();meter=audio.createAnalyser();meter.fftSize=512;master.connect(audio.destination);meter.connect(master);
 const noise=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),channel=noise.getChannelData(0);
 for(let i=0;i<channel.length;i++)channel[i]=Math.random()*2-1;
 hiss=audio.createBufferSource();hiss.buffer=noise;hiss.loop=true;filter=audio.createBiquadFilter();filter.type='bandpass';filter.Q.value=.8;hissGain=audio.createGain();hissGain.gain.value=0;hiss.connect(filter).connect(hissGain).connect(meter);hiss.start();volume()
 }await audio.resume()
}
function volume(){if(master)master.gain.setTargetAtTime((+$('volume').value/100)**1.6*.94,audio.currentTime,.025)}
function radioNoise(){if(!hissGain)return;filter.frequency.setTargetAtTime([2000,3600,1150][station]||2600,audio.currentTime,.07);hissGain.gain.setTargetAtTime(on&&station<0?.055:0,audio.currentTime,.04)}
function queueNextDub(current,playing,track){
 let nextTrack=composeLocalDub(track);
 playing.onended=()=>{
  if(current!==epoch)return;
  currentDub=nextTrack;
  play()
 };
 if(!apiKey)return;
 const controller=nextProgramController=new AbortController();
 message('次のDUBを編曲中…');
 generateDub(apiKey,track,controller.signal).then(result=>{
  if(current!==epoch||source!==playing)return;
  nextTrack=result;
  message('次の曲 · '+result.title);
 }).catch(()=>{
  if(current===epoch)message('次の曲 · '+nextTrack.title+'（端末で編曲）')
 }).finally(()=>{if(nextProgramController===controller)nextProgramController=null})
}
function playDub(current){
 const track=currentDub;
 $('origin').textContent=track.title+' · DUB';
 caption(track.vocal?'♪ 島の夜。海の風。':'♪');
 message(track.bpm+' BPM · '+(track.vocal?'SANA語ボーカル':'インストゥルメンタル'));
 const worker=voiceWorker=new Worker('music.js');
 worker.onerror=()=>{if(current===epoch)message('DUBの音声を作れませんでした。選局し直してください。')};
 worker.onmessage=({data:{pcm,sampleRate}})=>{
  if(current!==epoch)return;
  const buffer=audio.createBuffer(1,pcm.length,sampleRate);
  buffer.copyToChannel(pcm,0);
  source=audio.createBufferSource();
  source.buffer=buffer;
  source.connect(meter);
  source.start();
  worker.terminate();
  voiceWorker=null;
  const recordedIndex=recordedDubs.indexOf(track);
  if(recordedIndex>=0){
   rememberEdition(4,recordedIndex);
   indices[4]=recordedIndex+1
  }
  queueNextDub(current,source,track)
 };
 worker.postMessage(track)
}
async function play(nextBulletin){
 stopVoice();setSubtitleLines([]);$('origin').replaceChildren();const current=epoch;radioNoise();
 if(!on){glyph('sana');caption('POWERを入れると放送が始まります。');return}
 if(station<0){glyph('');caption('局間ノイズ');return}
 glyph('');caption('受信中…');
 try{if(station===4){playDub(current);return}
 const p=await program(station,nextBulletin);if(epoch!==current)return;if(station===3)rememberArticle(p.url,p.played);
 else if(p.editionIndex!==undefined)rememberEdition(station,p.editionIndex);
 const lines=p.lines;setSubtitleLines(lines);const origin=document.createElement(p.url?'a':'span');origin.textContent=p.label+(p.date?' · '+new Date(p.date).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})+' JST':'');if(p.url){origin.href=p.url;origin.target='_blank';origin.rel='noopener'}$('origin').append(origin);
 let n=0;
 const voices=await waitForEnglishVoices(station);
 let voiceIndex=0;
 if(current!==epoch)return;
 const worker=station===1?null:(voiceWorker=new Worker('voice.js'));
 let queuedBulletin;
 if(station<3&&apiKey){
  const controller=nextProgramController=new AbortController();
  generateBulletin(station,apiKey,lines,controller.signal).then(next=>{
   if(current===epoch)queuedBulletin=next
  }).catch(()=>{}).finally(()=>{
   if(nextProgramController===controller)nextProgramController=null
  })
 }
 function advance(){
  if(current!==epoch)return;
  n++;
  if(n===lines.length){
   if(p.editionIndex!==undefined)indices[station]=p.editionIndex+1;
   play(queuedBulletin);return
  }
  if(n%4===0)prepareEnglish();
  speakLine()
 }
 const weatherController=station===1&&apiKey&&weatherAiVoice&&!weatherAiUnavailable
  ?(weatherVoiceController=new AbortController()):null;
 const weatherAudio=new Map();
 function prepareWeatherAudio(index){
  if(!weatherAudio.has(index)){
   const promise=synthesizeWeather(lines[index],apiKey,voiceAccent,weatherController.signal)
    .then(bytes=>audio.decodeAudioData(bytes)).catch(()=>null);
   weatherAudio.set(index,promise)
  }
  return weatherAudio.get(index)
 }
 function playSentence(buffer,cues,line){
  function startSentence(){
   if(current!==epoch)return;
   const playing=source=audio.createBufferSource();
   playing.buffer=buffer;
   playing.connect(meter);
   const start=audio.currentTime+.045;
   wordIndex=-1;
   frameInfo={start,cues,line};
   playing.onended=()=>{
    if(current!==epoch)return;
    playing.disconnect();source=null;frameInfo=null;advance()
   };
   playing.start(start)
  }
  if(document.hidden)resumeSpeech=startSentence;
  else startSentence()
 }
 function speakLine(){
  if(current!==epoch)return;
  if(document.hidden){resumeSpeech=speakLine;return}
  if(!/[a-z0-9]/i.test(lines[n].sana)){
   showLine(lines[n]);glyph('');setTimeout(advance,600);return
  }
  if(weatherController&&!weatherAiUnavailable){
   const index=n,line=lines[index];
   message('WEATHER · AI音声を準備中…');
   prepareWeatherAudio(index).then(buffer=>{
    if(current!==epoch)return;
    weatherAudio.delete(index);
    if(!buffer){
     weatherAiUnavailable=true;
     weatherController.abort();
     speakLine();
     return
    }
    message('WEATHER · AI合成音声');
    if(index+1<lines.length&&!document.hidden)prepareWeatherAudio(index+1);
    const words=line.sana.match(/[a-z0-9-]+/gi)||[];
    const total=words.reduce((sum,word)=>sum+word.length+2,0);
    let elapsed=0;
    const cues=words.map(word=>{
     const cue={word,at:elapsed/total*buffer.duration};
     elapsed+=word.length+2;
     return cue
    });
    playSentence(buffer,cues,line)
   });
   return
  }
  const voice=voices[voiceIndex];
  if(voice){
   restartNativeSpeech=speakLine;
   message('朗読音声 · '+voice.name);
   narrate(lines[n],station,voice,()=>{
    restartNativeSpeech=null;
    advance()
   },()=>{
    restartNativeSpeech=null;
    if(!document.hidden)voiceIndex++;
    speakLine()
   });
  }else if(worker){
   message('朗読音声 · 内蔵'+(station===3?'女性':'')+'サンプル音声');
   worker.postMessage({station,line:lines[n]})
  }else{
   const line=lines[n];
   message('WEATHER · 利用できる英語音声がありません。字幕で放送中です。');
   showLine(line);
   glyph('');
   setTimeout(advance,Math.max(4500,line.ja.length*140))
  }
 }
 if(worker)worker.onerror=()=>{
  if(epoch!==current)return;
  caption('音声を準備できませんでした。');
  message('POWERを入れ直してください。')
 };
 if(worker)worker.onmessage=({data})=>{
  if(current!==epoch)return;
  const buffer=audio.createBuffer(1,data.pcm.length,16000);
  buffer.copyToChannel(data.pcm,0);
  playSentence(buffer,data.cues,lines[n])
 };
 speakLine()

 }catch{if(current===epoch)caption('受信できませんでした。');if(current===epoch)message('放送データを読み込めません。再読み込みしてください。')}
}
async function syncScreenLock(){
 if(!on||document.hidden){
  const currentLock=screenLock;
  screenLock=null;
  if(currentLock&&!currentLock.released)await currentLock.release().catch(()=>{});
  return
 }
 if(!navigator.wakeLock||screenLockPending||(screenLock&&!screenLock.released))return;
 screenLockPending=true;
 try{
  const lock=await navigator.wakeLock.request('screen');
  if(on&&!document.hidden)screenLock=lock;
  else await lock.release()
 }catch{
  // Playback remains available if the device declines to keep the screen awake.
 }finally{screenLockPending=false}
}
document.addEventListener('visibilitychange',()=>{
 void syncScreenLock();
 if(!on||station<0||station===4)return;
 if(document.hidden){
  if(restartNativeSpeech){
   resumeSpeech=restartNativeSpeech;
   restartNativeSpeech=null;
   endNarration()
  }
  if(source)audio.suspend().catch(()=>{});
  return
 }
 if(audio.state==='suspended')audio.resume().catch(()=>{});
 const resume=resumeSpeech;
 resumeSpeech=null;
 resume?.()
});
function tuneUI(){
 $('freq').textContent=(freq/1000).toFixed(3);$('tune').value=freq;$('tune').setAttribute('aria-valuetext',(freq/1000).toFixed(3)+' MHz');let u=(freq-6000)/4000;$('knob').style.transform='rotate('+(-135+270*u)+'deg)';$('needle').style.left=u*100+'%';
 $('screenStation').textContent=stations[station]?.name||'BAND SCAN';$('air').textContent=on?(station<0?'◌  SEARCH':'●  ON AIR'):'●  STANDBY';presetUI();

}
function tuning(f){freq=Math.min(10000,Math.max(6000,Math.round(f/5)*5));let prev=station;station=stations.findIndex(s=>Math.abs(s.f-freq)<=65);tuneUI();radioNoise();if(station!==prev)play()}
$('tune').oninput=e=>tuning(+e.target.value);
let drag=null;const knob=$('tune');knob.onpointerdown=e=>{e.preventDefault();knob.focus();knob.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,f:freq}};knob.onpointermove=e=>{if(drag)tuning(drag.f+(e.clientX-drag.x+drag.y-e.clientY)*10)};knob.onlostpointercapture=()=>drag=null;
$('power').onclick=async()=>{const btn=$('power');btn.disabled=true;try{if(!on){weatherAiUnavailable=false;await initAudio()}on=!on;void syncScreenLock();btn.setAttribute('aria-pressed',on);tuneUI();play();if(!on)await audio.suspend()}catch{message('このブラウザでは音声を開始できませんでした。')}finally{btn.disabled=false}};
$('volume').oninput=volume;$('subtitle').onclick=()=>{sub=!sub;$('subtitle').setAttribute('aria-pressed',sub);caption(lastCaption)};
$('settings').onclick=()=>{
 $('key').value=apiKey;
 $('voiceAccent').value=voiceAccent;

 try{$('remember').checked=!!localStorage.getItem('sana-radio-key')}catch{}
 $('dialog').showModal()
};
$('cancel').onclick=()=>$('dialog').close();
$('keyForm').onsubmit=e=>{
 e.preventDefault();
 const oldKey=apiKey,oldAccent=voiceAccent,oldWeatherAi=weatherAiVoice;
 apiKey=$('key').value.trim();
 voiceAccent=$('voiceAccent').value;

 weatherAiUnavailable=false;
 try{
  localStorage.setItem('sana-radio-voice-accent',voiceAccent);

  if(apiKey&&$('remember').checked)localStorage.setItem('sana-radio-key',apiKey);
  else localStorage.removeItem('sana-radio-key');
  message('設定を適用しました。')
 }catch{message('設定は今回のセッションで使用します。')}
 $('key').value='';
 $('dialog').close();
 tuneUI();
 const restartVoice=station>=0&&station<4&&oldAccent!==voiceAccent;
 const restartWeather=station===1&&oldWeatherAi!==weatherAiVoice;
 const restartApi=station>=0&&station!==3&&oldKey!==apiKey;
 if(on&&(restartVoice||restartWeather||restartApi))play();
 prepareEnglish()
};
async function translate(lines){const w=new Worker('engine.js');return new Promise((resolve,reject)=>{w.onerror=()=>{w.terminate();reject(Error('変換失敗'))};w.onmessage=e=>{w.terminate();if(e.data.error)reject(Error(e.data.error));else resolve(e.data.lines)};w.postMessage({lines})})}

const canvas=$('scope'),ctx=canvas.getContext('2d'),bins=new Uint8Array(256);
function draw(){let w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(on&&meter)meter.getByteFrequencyData(bins);ctx.fillStyle='#dfa04f';
 for(let i=0;i<145;i++){let x=i/144;let idle=.055+.46*Math.exp(-((x-.28)**2)/.0014)+.3*Math.exp(-((x-.64)**2)/.003)+.13*Math.exp(-((x-.79)**2)/.001);
 let v=on?.025+bins[Math.floor(x*210)]/255*.96:idle*(.38+.62*Math.abs(Math.sin(i*15.23)*Math.cos(i*.32)));ctx.fillRect(x*w,h-v*h,Math.max(1,w/145*.64),v*h)}
 if(frameInfo&&on){const clock=audio.getOutputTimestamp?.();const now=clock&&clock.performanceTime>0?clock.contextTime+(performance.now()-clock.performanceTime)/1000:audio.currentTime-(audio.outputLatency||0);const t=now-frameInfo.start;if(t>=0){showLine(frameInfo.line);const cues=frameInfo.cues;let i=wordIndex;while(i+1<cues.length&&cues[i+1].at<=t)i++;if(i!==wordIndex){wordIndex=i;glyph(cues[i].word)}}}
 requestAnimationFrame(draw)}
tuneUI();glyph('sana');draw();
