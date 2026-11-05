const form=document.querySelector('#supuestos');
const money=new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const put=(id,value)=>document.getElementById(id).textContent=value;
function calcular(){
 const valid=[...form.querySelectorAll('input')].every(input=>input.validity.valid&&Number.isFinite(input.valueAsNumber));
 document.querySelector('#salida-economia').hidden=!valid;
 put('error-economia',valid?'':'Completa todos los campos con números enteros no negativos dentro del rango permitido.');
 if(!valid)return;
 const value=id=>document.getElementById(id).valueAsNumber;
 const e=value('esencial'),i=value('innovacion'),n=e+i,f=value('fijos'),v=value('variable');
 const ingresos=e*value('precio-esencial')+i*value('precio-innovacion');
 const costos=f+n*v,resultado=ingresos-costos,inversion=value('inversion');
 put('ingresos',money.format(ingresos));put('costos',money.format(costos));put('resultado',money.format(resultado));
 const margen=n?ingresos/n-v:0;
 put('equilibrio',!n?'Equilibrio: agrega salones para definir una mezcla de planes.':margen<=0?'Con esta mezcla, el ingreso por salón no supera su costo variable: no existe un umbral de equilibrio por crecimiento.':`Equilibrio teórico: ${Math.ceil(f/margen)} salones equivalentes, manteniendo la proporción de planes actual. La mezcla real puede cambiar este umbral.`);
 put('recuperacion',inversion===0?'No se ha considerado inversión inicial.':resultado>0?`Recuperación simple estimada: ${Math.ceil(inversion/resultado)} meses, si el resultado se mantiene constante.`:'No se recupera la inversión con este escenario: el resultado mensual no es positivo.');
 put('anual',`Resultado operativo de 12 meses constantes: ${money.format(resultado*12)}. Después de descontar la inversión inicial: ${money.format(resultado*12-inversion)}. No equivale a utilidad neta.`);
}
form.addEventListener('input',calcular);form.addEventListener('reset',()=>setTimeout(calcular,0));form.addEventListener('submit',event=>event.preventDefault());calcular();
