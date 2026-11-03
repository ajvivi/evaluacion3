
  // Arrancar el motor de la App Móvil
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js')
        .then(registro => console.log('¡La App PWA está lista y funcionando! 📱✨', registro.scope))
        .catch(error => console.log('Hubo un error con la App 🥺', error));
    });
  }
