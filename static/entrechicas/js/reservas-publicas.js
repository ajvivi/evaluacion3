import {mostrarConfirmacion} from './confirmaciones.js';
import {api,salonPublico,money} from './api.js';
const form=document.querySelector('#formularioReserva'),select=document.querySelector('#servicio'),date=document.querySelector('#fecha'),hour=document.querySelector('#hora'),submit=form.querySelector('[type="submit"]'),status=document.querySelector('#estado-reserva'),catalog=document.querySelector('#catalogo-publico');
let ready=false,busy=false,controller,request=0,attempt=null;
const base='/api/publico/'+encodeURIComponent(salonPublico);
function options(node,placeholder,items){node.replaceChildren(new Option(placeholder,''));for(const [text,value] of items)node.add(new Option(text,value))}
async function horarios(){
 controller?.abort();controller=new AbortController();const current=++request;
 options(hour,'Selecciona una fecha y servicio',[]);hour.disabled=true;submit.disabled=true;
 if(!ready||!date.value||!select.value)return;
 try{const data=await api(base+'/horarios?fecha='+encodeURIComponent(date.value)+'&servicio='+encodeURIComponent(select.value),{signal:controller.signal});if(current!==request)return;
 options(hour,data.horarios.length?'Selecciona una hora':'Sin horas disponibles',data.horarios.map(h=>[h,h]));hour.disabled=!data.horarios.length;status.textContent=data.horarios.length?'':'Elige otra fecha.';
 }catch(e){if(e.name!=='AbortError'&&current===request)status.textContent=e.message}
}
async function cargar(){
 select.disabled=true;hour.disabled=true;submit.disabled=true;status.textContent='Conectando con el salón…';
 try{const data=await api(base);ready=!!data.acceso?.servicios;document.querySelectorAll('[data-nombre-salon]').forEach(n=>n.textContent=data.nombre);
 const contacto=document.querySelector('#contacto-publico');contacto.replaceChildren();for(const [label,value]of [['Ubicación',data.direccionPublica],['Teléfono',data.telefonoPublico],['Correo',data.correoPublico],['Horario configurado',data.apertura+':00 a '+data.cierre+':00 · consulta disponibilidad al reservar']]){const li=document.createElement('li');li.textContent=label+': '+(value||'No informado por el negocio');contacto.append(li)}
 const onlyShop=data.acceso?.modalidad==='cosmeticos';document.querySelector('[data-vista="servicios-clientas"]').hidden=onlyShop;if(onlyShop)document.querySelector('[data-vista="tienda-clientas"]').click();
 catalog.replaceChildren();for(const s of data.servicios){const li=document.createElement('li'),title=document.createElement('b'),price=document.createElement('span');title.textContent=s.nombre;price.className='precio-tag';price.textContent=`${money(s.precio)} · ${s.duracion} min`;li.append(title,document.createTextNode(' '),price);catalog.append(li)}
 if(!data.servicios.length)catalog.textContent=ready?'Este salón aún no tiene servicios disponibles.':data.acceso?.modalidad==='cosmeticos'?'Este negocio vende cosméticos. Visita la pestaña Cosméticos.':'El catálogo de servicios no está disponible por el momento.';document.querySelector('#btnAbrirModal').hidden=!ready;
 options(select,'Selecciona un servicio',data.servicios.map(s=>[`${s.nombre} · ${money(s.precio)}`,s.id]));select.disabled=!ready;status.textContent=ready?'Horarios del salón en Chile. No necesitas una cuenta para reservar.':'Las nuevas reservas no están disponibles por el momento.';
 }catch(e){ready=false;catalog.textContent='No se pudo cargar el catálogo actualizado. Recarga la página para intentar nuevamente.';status.textContent=e.message}
}
select.addEventListener('change',horarios);date.addEventListener('change',horarios);hour.addEventListener('change',()=>submit.disabled=busy||!hour.value);
form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!ready||!form.reportValidity())return;busy=true;submit.disabled=true;submit.textContent='Guardando…';
 try{const body={nombre:document.querySelector('#nombre').value,correo:document.querySelector('#correo').value,telefono:document.querySelector('#telefono').value,servicio_id:select.value,fecha:date.value,hora:hour.value};const key=JSON.stringify(body);if(attempt?.key!==key)attempt={key,id:crypto.randomUUID()};const r=await api(base+'/reservas',{method:'POST',body:{...body,solicitudId:attempt.id}});attempt=null;form.reset();options(hour,'Selecciona una fecha y servicio',[]);hour.disabled=true;status.textContent=r.mensaje+' Código: '+r.id;mostrarConfirmacion(form.parentElement,{tipo:'Reserva registrada',id:r.id,contacto:r.contacto,lineas:[r.resumen?.servicio||'Servicio reservado','Fecha: '+r.resumen?.fecha+' · Hora: '+r.resumen?.hora+' (Chile)','Duración: '+r.resumen?.duracion+' minutos','Valor del servicio: '+money(r.resumen?.precio||0),'Para cambios o cancelaciones, contacta al negocio e indica este código.']});
 }catch(e){status.textContent=e.message;if(e.status===409)await horarios()}
 finally{busy=false;submit.textContent='Confirmar Reserva';submit.disabled=!hour.value}
});
date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
cargar();
