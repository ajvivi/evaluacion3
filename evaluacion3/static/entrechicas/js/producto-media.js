export const categorias={general:'General',cabello:'Cabello',unas:'Uñas',labios:'Labios',rostro:'Rostro',cuerpo:'Cuerpo',accesorios:'Accesorios'};
export function nombreCategoria(id){return categorias[id]||categorias.general}
export function fotoProducto(parent,p,mini=false){
 const box=document.createElement('div');box.className=mini?'producto-miniatura':'producto-imagen';
 const placeholder=()=>{box.replaceChildren();const t=document.createElement('span');t.textContent=mini?'Sin foto':'Fotografía pendiente';box.append(t)};
 if(typeof p.imagen==='string'&&p.imagen.startsWith('data:image/jpeg;base64,')){const img=document.createElement('img');img.src=p.imagen;img.alt=p.nombre;img.loading='lazy';img.decoding='async';img.onerror=placeholder;box.append(img)}else placeholder();parent.append(box);
}
export async function prepararFoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Elige una foto JPG, PNG o WebP.');
 if(file.size>10*1024*1024)throw Error('La foto supera los 10 MB. Elige una imagen más pequeña.');
 const bitmap=await createImageBitmap(file);
 try{if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>40000000)throw Error('La imagen es demasiado grande. Usa una foto de menos de 40 megapíxeles.');
  const canvas=document.createElement('canvas');let lado=800;
  while(lado>=200){const scale=Math.min(1,lado/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const calidad of [.85,.7,.55]){const data=canvas.toDataURL('image/jpeg',calidad);if(data.length<=120000)return data}lado=Math.floor(lado*.75)}
  throw Error('No se pudo reducir la foto. Prueba con otra imagen.');
 }finally{bitmap.close()}
}
