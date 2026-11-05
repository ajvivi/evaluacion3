import {nailPoses,handBounds,smoothPoses,adjustPose} from './unas-geometria.js';
const $=id=>document.getElementById(id),video=$('video'),canvas=$('canvas'),ctx=canvas.getContext('2d');
const stage=document.createElement('canvas'),sc=stage.getContext('2d');
const VERSION='0.10.21';let detector,promise,stream,epoch=0,active=false,busy=false,raf=0,last=-1,lastRun=0,plain=false;
const status=s=>$('status').textContent=s;
const defaults=()=>({width:1,length:1,shift:0,side:0,rotation:0,visible:true});
let adjustments=Array.from({length:5},defaults),previousPoses=[],previousHand='';
function syncFinger(){const c=adjustments[Number($('finger').value)];for(const key of ['width','length','shift','side','rotation']){const value=key==='rotation'?c[key]:Math.round(c[key]*100);$('nail-'+key).value=value;$('nail-'+key+'-value').textContent=value+(key==='rotation'?'°':'%');}$('nail-visible').checked=c.visible;}
$('finger').onchange=syncFinger;
for(const key of ['width','length','shift','side','rotation'])$('nail-'+key).oninput=()=>{const value=Number($('nail-'+key).value);adjustments[Number($('finger').value)][key]=key==='rotation'?value:value/100;syncFinger();};
$('nail-visible').onchange=()=>adjustments[Number($('finger').value)].visible=$('nail-visible').checked;
$('reset-nail').onclick=()=>{adjustments[Number($('finger').value)]=defaults();syncFinger();};
syncFinger();
async function load(){const {HandLandmarker,FilesetResolver}=await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`);const fs=await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`);return HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.6});}
function stop(message='La cámara está apagada.'){
 epoch++;active=false;busy=false;previousPoses=[];previousHand='';cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;ctx.clearRect(0,0,canvas.width,canvas.height);sc.clearRect(0,0,stage.width,stage.height);$('empty').hidden=false;$('start').disabled=false;$('stop').disabled=true;$('camera-choice').disabled=false;status(message);
}
function nail(p){const w=p.width,h=p.length;sc.save();sc.translate(p.x,p.y);sc.rotate(p.angle);sc.beginPath();sc.roundRect(-w/2,-h/2,w,h,[w*.45,w*.45,w*.25,w*.25]);sc.clip();sc.globalAlpha=Number($('opacity').value)/100;sc.fillStyle=$('color').value;sc.fillRect(-w,-h,w*2,h*2);sc.globalAlpha=Number($('opacity').value)/100;
 if($('acabado').value==='francesa'){sc.fillStyle='rgba(255,252,249,.9)';sc.fillRect(-w/2,-h/2,w,h*.2)}
 if($('acabado').value!=='mate'){const g=sc.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'rgba(0,0,0,.12)');g.addColorStop(.35,'rgba(255,255,255,.32)');g.addColorStop(.6,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.12)');sc.fillStyle=g;sc.fillRect(-w/2,-h/2,w,h)}sc.restore();
 if($('guides').checked&&p.finger===Number($('finger').value)){sc.save();sc.translate(p.x,p.y);sc.rotate(p.angle);sc.strokeStyle='#70ffe1';sc.lineWidth=2;sc.setLineDash([4,3]);sc.strokeRect(-w/2-2,-h/2-2,w+4,h+4);sc.restore();}
}
function frame(now){if(!active)return;try{if(video.readyState>=2&&video.currentTime!==last&&now-lastRun>1000/20){last=video.currentTime;lastRun=now;const w=video.videoWidth,h=video.videoHeight;for(const surface of [canvas,stage]){if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h;}}
 const result=detector.detectForVideo(video,now),hands=(result.landmarks||[]).slice(0,1);
 const identity=result.handedness?.[0]?.[0]?.categoryName||'';
 if(identity!==previousHand){previousPoses=[];previousHand=identity;}
 sc.drawImage(video,0,0,w,h);
 previousPoses=smoothPoses(hands.length?nailPoses(hands[0],w,h,{size:Number($('size').value)/100,offset:Number($('offset').value)/100}):[],previousPoses);
 if(!plain)for(const pose of previousPoses){const adjusted=adjustPose(pose,adjustments);if(adjusted)nail(adjusted);}
 ctx.fillStyle='#30242e';ctx.fillRect(0,0,w,h);ctx.save();if($('camera-choice').value==='user'){ctx.translate(w,0);ctx.scale(-1,1)}
 const box=$('crop').checked?handBounds(hands,w,h):{x:0,y:0,w,h};if(box&&box.w>1&&box.h>1){const scale=Math.min(w/box.w,h/box.h);const dw=box.w*scale,dh=box.h*scale;ctx.drawImage(stage,box.x,box.y,box.w,box.h,(w-dw)/2,(h-dh)/2,dw,dh)}ctx.restore();$('empty').hidden=hands.length>0||!$('crop').checked;
 status(hands.length?(plain?'Comparando: uñas sin esmalte virtual.':'Mano detectada · Ajusta cada uña si el color queda fuera.'):'Muestra una mano abierta, con las uñas hacia la cámara.');
 }raf=requestAnimationFrame(frame)}catch(e){console.error(e);stop('No se pudo continuar el seguimiento. Vuelve a activar la cámara.')}}
$('start').onclick=async()=>{if(active||busy)return;if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){status('Abre desde HTTPS o localhost para usar la cámara.');return}busy=true;$('camera-choice').disabled=true;$('start').disabled=true;$('stop').disabled=false;const token=++epoch;
 try{status('Cargando detector de manos…');if(!promise)promise=load().catch(e=>{promise=null;throw e});detector=await promise;if(token!==epoch)return;status('Acepta el permiso de cámara.');const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:$('camera-choice').value},width:{ideal:640},height:{ideal:480}},audio:false});if(token!==epoch){acquired.getTracks().forEach(t=>t.stop());return}stream=acquired;video.srcObject=stream;await video.play();if(token!==epoch)return;active=true;busy=false;last=-1;lastRun=0;stream.getVideoTracks()[0].onended=()=>{if(active)stop('La cámara se desconectó.')};raf=requestAnimationFrame(frame);
 }catch(e){if(token!==epoch)return;console.error(e);stop(({NotAllowedError:'Permiso de cámara denegado. Habilítalo en el navegador.',NotFoundError:'No se encontró una cámara.',NotReadableError:'La cámara está ocupada por otra aplicación.'})[e.name]||'No se pudo cargar el detector. Revisa internet y vuelve a intentar.')}};
$('stop').onclick=()=>stop();$('compare').onclick=()=>{plain=!plain;$('compare').setAttribute('aria-pressed',String(plain));$('compare').textContent=plain?'Volver al esmalte':'Ver sin esmalte'};
for(const id of ['size','offset','opacity'])$(id).oninput=()=>$(id+'Value').textContent=$(id).value+'%';
$('reset').onclick=()=>{for(const [id,v] of Object.entries({size:100,offset:0,opacity:75})){$(id).value=v;$(id+'Value').textContent=v+'%'}$('color').value='#b62957';$('acabado').value='brillo';adjustments=Array.from({length:5},defaults);previousPoses=[];$('guides').checked=false;syncFinger();if(plain)$('compare').onclick();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(active||busy))stop()});addEventListener('pagehide',()=>stop());
