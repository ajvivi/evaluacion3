export function mostrarConfirmacion(parent,{tipo,id,lineas,contacto}){
 let box=parent.querySelector('.confirmacion-operacion');if(!box){box=document.createElement('section');box.className='confirmacion-operacion';box.setAttribute('aria-label','Resumen de la operación');parent.append(box)}box.replaceChildren();
 const h=document.createElement('h3');h.textContent=tipo;const codigo=document.createElement('p');codigo.textContent='Código: '+id;box.append(h,codigo);
 const textos=[tipo,'Código: '+id,...lineas];for(const t of lineas){const p=document.createElement('p');p.textContent=t;box.append(p)}
 const nota='Este resumen no acredita un pago y no tiene validez tributaria. Conserva el código para consultar al negocio.';const p=document.createElement('p');p.textContent=nota;box.append(p);textos.push(nota);
 if(contacto){for(const [label,key]of [['Teléfono','telefonoPublico'],['Correo','correoPublico']])if(contacto[key]){const p=document.createElement('p');p.textContent=label+': '+contacto[key];box.append(p);textos.push(p.textContent)}}
 const button=document.createElement('button');button.type='button';button.textContent='Descargar resumen';button.onclick=()=>{const url=URL.createObjectURL(new Blob([textos.join('\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='entre-chicas-'+id+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};box.append(button);box.tabIndex=-1;box.focus();
}
