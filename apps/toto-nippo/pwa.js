let installPrompt;
const installButton=document.getElementById('installApp');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});
installButton.addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;installButton.hidden=true;await prompt.prompt();await prompt.userChoice});
window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true});
if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{console.warn('Offline installation unavailable')})});
