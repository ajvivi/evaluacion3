import { recolor } from './cabello-mezcla.js';
const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
const frame = document.createElement('canvas'), frameCtx = frame.getContext('2d', { willReadFrequently: true });
const maskCanvas = document.createElement('canvas'), maskCtx = maskCanvas.getContext('2d');
const scaledMask = document.createElement('canvas'), scaledCtx = scaledMask.getContext('2d', { willReadFrequently: true });
let worker, stream, active = false, token = 0, timer, watchdog, readyReject;
let sourcePixels, currentMask, original = false;
function message(text) { $('status').textContent = text; }
function stop(text = 'La cámara está apagada.') {
  token++; active = false;
  clearTimeout(timer); clearTimeout(watchdog);
  readyReject?.(new Error('cancelled')); readyReject = null;
  worker?.terminate(); worker = null;
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  video.srcObject = null;
  sourcePixels = null; currentMask = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  $('empty').hidden = false; $('start').disabled = false; $('stop').disabled = true;
  message(text);
}
function paint() {
  if (!sourcePixels || !currentMask) return;
  const pixels = new ImageData(new Uint8ClampedArray(sourcePixels.data), canvas.width, canvas.height);
  recolor(pixels.data, currentMask, $('hair-color').value, Number($('intensity').value) / 100, original, $('show-mask').checked);
  ctx.putImageData(pixels, 0, 0);
}
function receiveMask(data) {
  clearTimeout(watchdog);
  const scores = new Float32Array(data.scores);
  maskCanvas.width = data.width; maskCanvas.height = data.height;
  const mask = maskCtx.createImageData(data.width, data.height);
  const threshold = Number($('threshold').value) / 100;
  let covered = 0;
  for (let i = 0; i < scores.length; i++) {
    const t = Math.max(0, Math.min(1, (scores[i] - threshold) / .18));
    const alpha = t * t * (3 - 2 * t);
    mask.data[i * 4 + 3] = Math.round(alpha * 255);
    covered += alpha;
  }
  maskCtx.putImageData(mask, 0, 0);
  scaledCtx.clearRect(0, 0, scaledMask.width, scaledMask.height);
  scaledCtx.drawImage(maskCanvas, 0, 0, scaledMask.width, scaledMask.height);
  currentMask = scaledCtx.getImageData(0, 0, scaledMask.width, scaledMask.height).data;
  paint(); $('empty').hidden = true;
  message(covered / scores.length < .002 ? 'No detectamos suficiente cabello. Mejora la luz y deja tu pelo dentro del encuadre.' : original ? 'Comparando: tu color original.' : 'Color simulado activo. Muévete suavemente.');
  timer = setTimeout(capture, 80);
}
async function capture() {
  const session = token;
  if (!active || video.readyState < 2) { if (active) timer = setTimeout(capture, 100); return; }
  try {
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale)), height = Math.max(1, Math.round(video.videoHeight * scale));
    // Cada lienzo debe sincronizarse: el visible ya puede medir 640 x 480,
    // mientras que los creados con JS empiezan con 300 x 150.
    for (const surface of [canvas, frame, scaledMask]) {
      if (surface.width !== width || surface.height !== height) {
        surface.width = width;
        surface.height = height;
      }
    }
    document.querySelector('.hair-camera').style.aspectRatio = `${width}/${height}`;
    frameCtx.drawImage(video, 0, 0, width, height);
    sourcePixels = frameCtx.getImageData(0, 0, width, height);
    const bitmap = await createImageBitmap(frame);
    if (session !== token || !active) { bitmap.close(); return; }
    watchdog = setTimeout(() => stop('El detector tardó demasiado. Vuelve a activar la cámara.'), 15000);
    worker.postMessage({ type: 'frame', bitmap, timestamp: performance.now() }, [bitmap]);
  } catch (error) { if (session === token) stop('No pudimos procesar la cámara. Inténtalo nuevamente en un navegador actualizado.'); }
}
async function start() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    message('La cámara necesita HTTPS o localhost. Abre el sitio desde una dirección segura.'); return;
  }
  if (!window.Worker || !window.createImageBitmap) { message('Este navegador no admite el detector. Prueba con Chrome o Safari actualizado.'); return; }
  const session = ++token;
  $('start').disabled = true; $('stop').disabled = false;
  message('Cargando el detector de cabello. La primera vez puede tardar…');
  try {
    worker = new Worker(new URL('./cabello-worker.js', import.meta.url));
    await new Promise((resolve, reject) => {
      readyReject = reject;
      watchdog = setTimeout(() => reject(new Error('model')), 60000);
      worker.onerror = () => { if (session === token) stop('No se pudo iniciar el detector. Revisa la conexión y vuelve a intentar.'); };
      worker.onmessage = ({ data }) => {
        if (session !== token) return;
        if (data.type === 'ready') { clearTimeout(watchdog); readyReject = null; resolve(); }
        else if (data.type === 'mask') receiveMask(data);
        else if (data.type === 'error') { console.error('Detector de cabello:', data.message); stop('No se pudo cargar o ejecutar el detector. Revisa internet y vuelve a intentar.'); }
      };
      worker.postMessage({ type: 'init' });
    });
    if (session !== token) return;
    message('Permite el acceso a tu cámara para probar un color.');
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
    if (session !== token) { acquired.getTracks().forEach(t => t.stop()); return; }
    stream = acquired; video.srcObject = stream;
    stream.getVideoTracks()[0].addEventListener('ended', () => { if (session === token) stop('La cámara se desconectó. Vuelve a activarla.'); });
    await video.play();
    if (session !== token) return;
    active = true; capture();
  } catch (error) {
    if (session !== token) return;
    const messages = { NotAllowedError: 'Permiso de cámara denegado. Permítelo en la configuración del navegador.', NotFoundError: 'No encontramos una cámara disponible.', NotReadableError: 'Otra aplicación podría estar usando la cámara. Ciérrala e intenta nuevamente.' };
    stop(messages[error.name] || 'No se pudo iniciar el probador. Revisa internet y vuelve a activar la cámara.');
  }
}
$('start').addEventListener('click', start);
$('stop').addEventListener('click', () => stop());
$('compare').addEventListener('click', () => { original = !original; $('compare').setAttribute('aria-pressed', String(original)); $('compare').textContent = original ? 'Ver color elegido' : 'Ver color original'; paint(); });
for (const id of ['hair-color', 'intensity', 'threshold', 'show-mask']) $(id).addEventListener('input', () => { $('intensity-value').value = $('intensity').value + '%'; $('threshold-value').value = $('threshold').value + '%'; paint(); });
$('reset').addEventListener('click', () => { $('hair-color').value = '#b8552e'; $('intensity').value = 65; $('threshold').value = 65; $('show-mask').checked = false; $('intensity-value').value = '65%'; $('threshold-value').value = '65%'; if (original) $('compare').click(); paint(); });
window.addEventListener('pagehide', () => stop());
document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Cámara apagada al salir de la página. Actívala para continuar.'); });
