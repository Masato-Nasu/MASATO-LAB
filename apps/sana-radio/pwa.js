let installer;
const installButton=document.getElementById('install');
if(!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone){
 installButton.hidden=false;
 installButton.onclick=async()=>{
  if(installer){await installer.prompt();installer=null;return}
  document.getElementById('installHelp').showModal()
 };
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installer=event});
window.addEventListener('appinstalled',()=>{installer=null;installButton.hidden=true});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
