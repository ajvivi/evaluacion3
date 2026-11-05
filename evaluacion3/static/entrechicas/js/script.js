// =========================================================
// 🌸 INICIO DE LAS ANIMACIONES Y EVENTOS DE LA PÁGINA
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById('modalReservas');

  // =========================================================
  // 🎵 CONTROL DE AUDIO DEL VIDEO DE FONDO (VERSIÓN CLÁSICA)
  // =========================================================
  const videoFondo = document.querySelector('.video-fondo-pantalla') || document.getElementById('videoFondo');
  const btnAudio = document.getElementById('btnAudio');

  if (videoFondo && btnAudio) {
    videoFondo.muted = true; // Empieza en silencio por reglas del navegador
    
    btnAudio.addEventListener('click', () => {
      if (videoFondo.muted) {
        videoFondo.muted = false;
        btnAudio.innerHTML = ' Silenciar'; 
      } else {
        videoFondo.muted = true;
        btnAudio.innerHTML = ' Activar Sonido';
      }
    });
  }
  
  // =========================================================
  // 🪟 CONTROL DEL MODAL (POP-UP) DE RESERVAS 
  // =========================================================
  const btnAbrir = document.getElementById('btnAbrirModal');
  const btnCerrar = document.getElementById('btnCerrarModal');

  if (modal && btnAbrir && btnCerrar) {
    const cerrar=()=>{modal.classList.remove('activo');btnAbrir.focus()};
    btnAbrir.addEventListener('click',e=>{e.preventDefault();modal.classList.add('activo');btnCerrar.focus()});
    btnCerrar.addEventListener('click',cerrar);
    modal.addEventListener('click',e=>{if(e.target===modal)cerrar()});
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();cerrar();return}
      if(e.key!=='Tab')return;
      const items=[...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    });
  }

  // =========================================================
  // 🎬 EFECTO 3D: MOUSE + SCROLL EN EL VIDEO DE FONDO 🖱️📜
  // =========================================================
  let ratonX = 0;
  let scrollY = 0;

  document.addEventListener('mousemove', (evento) => {
    const centroX = window.innerWidth / 2;
    ratonX = (evento.clientX - centroX) / 40; 
    actualizarVideo3D(); 
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    actualizarVideo3D(); 
  });

  function actualizarVideo3D() {
    if (videoFondo) {
      let inclinacion3D = scrollY * 0.03; 
      let profundidadZ = scrollY * -0.5;

      videoFondo.style.transform = `
        perspective(1000px) 
        translate3d(${ratonX}px, 0px, ${profundidadZ}px) 
        rotateX(${inclinacion3D}deg) 
        scale(1.2)
      `;
    }
  }

  // =========================================================
  // 🃏 INCLINACIÓN 3D INTERACTIVA EN TARJETAS
  // =========================================================
  const tarjetasInteractivas = document.querySelectorAll('.tarjeta-servicios-grande:not(.tarjeta-servicios-estatica), .tarjeta-nosotros-grande');

  tarjetasInteractivas.forEach(tarjeta => {
    tarjeta.addEventListener('mousemove', (e) => {
      const rect = tarjeta.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotarX = (y / rect.height) * -8;
      const rotarY = (x / rect.width) * 8;

      tarjeta.style.transform = `rotateX(${rotarX}deg) rotateY(${rotarY}deg)`;
      if(tarjeta.classList.contains('tarjeta-nosotros-grande')) {
         tarjeta.style.boxShadow = `0 30px 60px rgba(0,0,0,0.12)`;
      }
    });

    tarjeta.addEventListener('mouseleave', () => {
      tarjeta.style.transform = 'rotateX(0deg) rotateY(0deg)';
      if(tarjeta.classList.contains('tarjeta-nosotros-grande')) {
         tarjeta.style.boxShadow = `0 20px 50px rgba(0,0,0,0.1)`;
      }
    });
  });

  const fotoNosotros = document.querySelector('.tarjeta-nosotros-grande .lado-foto img');
  window.addEventListener('scroll', () => {
    if (fotoNosotros) {
      let scrollActual = window.scrollY;
      fotoNosotros.style.transform = `translateY(${scrollActual * 0.03}px)`;
    }
  });

});
