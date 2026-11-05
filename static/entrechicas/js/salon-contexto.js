// Mantener el salón al ir al probador y volver al sitio público.
const salon=new URLSearchParams(location.search).get('salon');
if(salon&&/^[a-zA-Z0-9_-]{1,128}$/.test(salon)){
 document.querySelectorAll('a[href]').forEach(a=>{
  const url=new URL(a.getAttribute('href'),location.href);
  if(url.origin===location.origin&&url.pathname.endsWith('.html')&&!url.pathname.endsWith('/admin.html')){url.searchParams.set('salon',salon);a.href=url.href;}
 });
}
