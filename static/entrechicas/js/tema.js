// Preferencia local de apariencia. No necesita cuenta ni cambia datos del salón.
(()=>{
 const key='entrechicas-tema',root=document.documentElement;
 let choice='claro',select;
 try{if(localStorage.getItem(key)==='oscuro')choice='oscuro'}catch{}
 function apply(value){choice=value==='oscuro'?'oscuro':'claro';root.dataset.tema=choice;if(select)select.value=choice;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',choice==='oscuro'?'#19151e':'#6a4c9c')}
 apply(choice);
 function mount(){
  if(document.getElementById('selector-tema'))return;
  const bar=document.createElement('div');bar.className='theme-toolbar';
  const label=document.createElement('label');label.htmlFor='selector-tema';label.textContent='Apariencia';
  select=document.createElement('select');select.id='selector-tema';select.setAttribute('aria-label','Tema del sitio');
  for(const [value,text]of [['claro','Claro'],['oscuro','Oscuro']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
  select.value=choice;select.addEventListener('change',()=>{apply(select.value);try{localStorage.setItem(key,choice)}catch{}});
  bar.append(label,select);(document.querySelector('.tarjeta-principal')||document.querySelector('main')||document.body).prepend(bar);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(event.newValue)});
})();
