import {API_BASE,SALON_PILOTO} from './config.js';
export const salonPublico=new URLSearchParams(location.search).get('salon')||SALON_PILOTO;
export async function api(path,{method='GET',body,user,signal}={}){
 if(!API_BASE)throw Error('Falta configurar la dirección del servidor en config.js.');
 const headers={'Content-Type':'application/json'};const token=document.cookie.split('; ').find(v=>v.startsWith('csrftoken='))?.split('=')[1];if(token)headers['X-CSRFToken']=decodeURIComponent(token);
 let response;try{response=await fetch(API_BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:signal||AbortSignal.timeout(20000)})}catch(e){if(e.name==='AbortError')throw e;throw Error('No se pudo conectar al servidor. Revisa que esté iniciado y vuelve a intentar.')}
 const result=await response.json().catch(()=>({error:'Respuesta inesperada del servidor.'}));
 if(!response.ok){const e=Error(result.error||'No se pudo completar la operación.');e.status=response.status;throw e}return result;
}
export const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
