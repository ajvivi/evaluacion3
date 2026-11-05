
const $=id=>document.getElementById(id);
const video=$('video'), canvas=$('canvas'), ctx=canvas.getContext('2d');
const start=$('start'), stop=$('stop'), status=$('status');
const VERSION='0.10.22-rc.20250304';
let detectorPromise=null;
let detector=null, stream=null, active=false, loading=false, frame=0, lastTime=-1, lastRun=0, epoch=0;
let color='#bd416d', plain=false;
// Closed outer and inner lip contours in MediaPipe's face landmark topology.
const outer=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
const inner=[78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95];
function message(text){if(status.textContent!==text)status.textContent=text;}
document.querySelectorAll('.tone').forEach(button=>button.addEventListener('click',()=>{
 color=button.dataset.color; $('toneName').textContent='Tono: '+button.dataset.name;
 document.querySelectorAll('.tone').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
$('intensity').addEventListener('input',()=>{$('amount').value=$('intensity').value+'%';});
$('compare').addEventListener('click',()=>{plain=!plain;$('compare').setAttribute('aria-pressed',String(plain));$('compare').textContent=plain?'Volver al labial':'Ver sin maquillaje';});
function shutdown(text='La cámara está apagada.'){
 epoch++;active=false;loading=false;cancelAnimationFrame(frame);
 if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;
 video.pause();video.srcObject=null;ctx.clearRect(0,0,canvas.width,canvas.height);
 $('empty').hidden=false;start.disabled=false;stop.disabled=true;message(text);
}
function contour(points,indices){indices.forEach((index,i)=>{const p=points[index];if(i===0)ctx.moveTo(p.x*canvas.width,p.y*canvas.height);else ctx.lineTo(p.x*canvas.width,p.y*canvas.height);});ctx.closePath();}
function render(now){
 if(!active)return;
 try{
 if(video.readyState>=2&&video.currentTime!==lastTime&&now-lastRun>=1000/24){
 lastTime=video.currentTime;lastRun=now;
 if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight;}
 const result=detector.detectForVideo(video,now);
 ctx.drawImage(video,0,0,canvas.width,canvas.height);
 const face=result.faceLandmarks[0];
 if(face){
 if(!plain){ctx.save();ctx.beginPath();contour(face,outer);contour(face,inner);ctx.globalAlpha=Number($('intensity').value)/100;ctx.globalCompositeOperation='multiply';ctx.fillStyle=color;ctx.fill('evenodd');ctx.restore();}
 message('Rostro detectado · Puedes cambiar el tono.');
 }else message('Acerca tu rostro y mira hacia la cámara.');
 }
 frame=requestAnimationFrame(render);
 }catch(error){console.error(error);shutdown('Se interrumpió la detección. Intenta activar la cámara de nuevo.');}
}
start.addEventListener('click',async()=>{
 if(active||loading)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){message('Abre esta página desde HTTPS o localhost para usar la cámara.');return;}
 loading=true;start.disabled=true;stop.disabled=false;const token=++epoch;
 try{
 message('Cargando el detector facial… La primera vez puede tardar.');
 if(!detectorPromise){
 detectorPromise=(async()=>{
 const {FaceLandmarker,FilesetResolver}=await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`);
 const files=await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`);
 return FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:0.6,minTrackingConfidence:0.6});
 })().catch(error=>{detectorPromise=null;throw error;});
 }
 detector=await detectorPromise;
 if(token!==epoch)return;
 message('Acepta el permiso de cámara para continuar.');
 const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
 if(token!==epoch){acquired.getTracks().forEach(t=>t.stop());return;}
 stream=acquired;video.srcObject=stream;await video.play();
 if(token!==epoch)return;
 stream.getVideoTracks()[0].addEventListener('ended',()=>{if(active)shutdown('La cámara se desconectó. Puedes volver a activarla.');});
 active=true;loading=false;stop.disabled=false;$('empty').hidden=true;lastTime=-1;lastRun=0;
 frame=requestAnimationFrame(render);
 }catch(error){
 if(token!==epoch)return;
 console.error(error);
 const errors={NotAllowedError:'Permiso de cámara denegado. Habilítalo en los permisos del sitio.',NotFoundError:'No se encontró una cámara conectada.',NotReadableError:'No se pudo abrir la cámara. Cierra otras aplicaciones que puedan estar usándola.'};
 shutdown(errors[error.name]||'No se pudo iniciar. Revisa internet y el acceso a jsDelivr y Google Storage, y vuelve a intentarlo.');
 }
});
stop.addEventListener('click',()=>shutdown());
window.addEventListener('pagehide',()=>shutdown());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(active||loading))shutdown('Cámara apagada al salir de la pestaña. Actívala para continuar.');});
