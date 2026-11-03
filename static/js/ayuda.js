import {api,salonPublico} from './api.js';
const $=id=>document.getElementById(id),form=$('form-ayuda'),input=$('pregunta-ayuda'),enviar=$('enviar-ayuda'),log=$('mensajes-ayuda');
let config=null,ocupado=false;
const rutas=new Set(['/index.html','/index.html#servicios','/index.html#nosotros','/tienda.html','/admin.html','/peinados.html','/unas.html','/espejo.html']);
function mensaje(texto,tipo){const a=document.createElement('article');a.className='mensaje '+tipo;const p=document.createElement('p');p.textContent=texto;a.append(p);log.append(a);while(log.children.length>16)log.firstElementChild.remove();return a}
function actualizar(){enviar.disabled=ocupado||!config;enviar.textContent=ocupado?'Buscando información…':'Consultar';$('limpiar-chat').disabled=ocupado}
async function cargar(){try{config=await api('/api/ayuda/config');$('consentimiento-externo').hidden=!config.enviaExterno;$('acepta-externo').required=config.enviaExterno;$('modo-ayuda').textContent=config.proveedor==='consulta'?'Modo consulta del sitio · IA aún no configurada':config.proveedor==='gemini'?'Asistente con IA · Gemini':'Asistente con IA local · Ollama';actualizar()}catch(e){$('modo-ayuda').textContent='No se pudo conectar. Revisa el servidor y recarga la página.'}}
cargar();
document.querySelectorAll('[data-pregunta]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.pregunta;input.focus();input.scrollIntoView({block:'nearest',behavior:'smooth'})}));
$('limpiar-chat').addEventListener('click',()=>{log.replaceChildren();input.value='';$('error-ayuda').textContent='';mensaje('¿Qué te gustaría saber de Entre Chicas?','asistente');input.focus()});
form.addEventListener('submit',async e=>{e.preventDefault();if(ocupado||!config||!form.reportValidity())return;const pregunta=input.value.trim();if(pregunta.length<3)return;ocupado=true;actualizar();$('error-ayuda').textContent='';mensaje(pregunta,'usuario');log.setAttribute('aria-busy','true');
 try{
  const data=await api('/api/publico/'+encodeURIComponent(salonPublico)+'/ayuda',{method:'POST',body:{pregunta,aceptaExterno:$('acepta-externo').checked},signal:AbortSignal.timeout(40000)});
  const a=mensaje(data.respuesta,'asistente'),aviso=document.createElement('small');aviso.textContent=data.aviso||'Consulta del sitio';a.append(aviso);
  if(data.fuentes?.length){const details=document.createElement('details'),summary=document.createElement('summary'),ul=document.createElement('ul');summary.textContent='Ver fuentes consultadas';details.append(summary,ul);for(const f of data.fuentes){if(!rutas.has(f.ruta))continue;const li=document.createElement('li'),link=document.createElement('a'),texto=document.createElement('blockquote'),url=new URL(f.ruta,location.href);if(!url.pathname.endsWith('/admin.html'))url.searchParams.set('salon',salonPublico);link.href=url.href;link.textContent=f.titulo;texto.textContent=f.texto;li.append(link,texto);ul.append(li)}a.append(details)}
  input.value='';
 }catch(e){$('error-ayuda').textContent=e.name==='TimeoutError'||e.name==='AbortError'?'La consulta tardó demasiado. Intenta de nuevo.':e.message}
 finally{ocupado=false;log.setAttribute('aria-busy','false');actualizar();log.scrollTop=log.scrollHeight;input.focus()}
});
