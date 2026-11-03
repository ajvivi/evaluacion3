const sectionPlanes=document.querySelector('#servicios');
const selectores=[...document.querySelectorAll('[data-vista]')];
selectores.forEach(button=>button.addEventListener('click',()=>{
  selectores.forEach(b=>{
    const active=b===button;
    b.setAttribute('aria-pressed',String(active));
    document.getElementById(b.dataset.vista).hidden=!active;
  });
  sectionPlanes.classList.toggle('vista-negocio',button.dataset.vista==='servicios-salones');
  dispatchEvent(new Event('resize'));
}));
const propuestas={
  'Esencial':{precio:'$25.000 CLP / mes · Valor propuesto',descripcion:'Dirigido a salones pequeños. Catálogo y reservas para servicios o tienda de cosméticos con solicitudes de compra, según la modalidad del negocio.',pendiente:'Incluye registro y acceso privado, catálogo conectado y una agenda por salón. Esta integración utiliza un salón de demostración; la contratación de planes no está implementada. No se cobra dinero.'},
  'Innovación':{precio:'$60.000 CLP / mes · Valor propuesto',descripcion:'Incluye todo Esencial: catálogo de servicios, reservas, tienda de cosméticos y solicitudes de compra. Añade los probadores de color de cabello, labiales y uñas mientras la suscripción esté vigente.',pendiente:'La RA está en fase de prototipo: no garantiza el resultado de un tratamiento. No incluye diagnósticos clínicos ni predicción de demanda.'},
  'Franquicia':{precio:'A cotizar · Contrato anual + instalación',descripcion:'Orientado a cadenas. Alcance previsto: múltiples sucursales, reportes comerciales y predicción de demanda.',pendiente:'Funciones futuras. La propuesta es informativa. Quedan pendientes la gestión de sucursales y la validación de modelos predictivos con datos suficientes.'}
};
let seleccionado='';const dialog=document.querySelector('#detalle-plan');
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{
 seleccionado=button.dataset.plan;const p=propuestas[seleccionado];
 document.querySelector('#detalle-titulo').textContent='Plan '+seleccionado;
 document.querySelector('#detalle-precio').textContent=p.precio;
 document.querySelector('#detalle-descripcion').textContent=p.descripcion;
 document.querySelector('#detalle-pendiente').textContent=p.pendiente;
 if(seleccionado==='Innovación')document.querySelector('#modalidad-propuesta').value='mixto';document.querySelector('#modalidad-propuesta').disabled=seleccionado==='Innovación';actualizarEnlacePlan();document.querySelector('#modalidad-propuesta').hidden=seleccionado==='Franquicia';document.querySelector('#modalidad-propuesta-label').hidden=seleccionado==='Franquicia';
 dialog.showModal();
}));
document.querySelector('#descargar-propuesta').addEventListener('click',()=>{
 const p=propuestas[seleccionado];if(!p)return;
 const txt=`ENTRE CHICAS — PROPUESTA ACADÉMICA\nPlan ${seleccionado}\n${p.precio}\n\n${p.descripcion}\n\nEstado y pendientes: ${p.pendiente}\n\nNo es un contrato ni una suscripción activa. No se realizan cobros. Precios sujetos a validación; impuestos, soporte, instalación y condiciones por definir antes de contratar.\n`;
 const url=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`propuesta-${seleccionado.toLowerCase()}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

function actualizarEnlacePlan(){const q=new URLSearchParams({plan:({Esencial:'esencial',Innovación:'innovacion',Franquicia:'franquicia'}[seleccionado]||'esencial'),modalidad:document.querySelector('#modalidad-propuesta').value});document.querySelector('#elegir-plan').href='/admin.html?'+q.toString()}
document.querySelector('#modalidad-propuesta').addEventListener('change',actualizarEnlacePlan);
