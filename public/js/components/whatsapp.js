// Botón flotante de WhatsApp: abre la tarjeta de asesoría con el enlace ya preparado (HU04).
export function iniciarWhatsapp() {
  const raiz = document.querySelector('[data-whatsapp]');
  if (!raiz) {
    return;
  }
  const boton = raiz.querySelector('[data-whatsapp-boton]');
  const tarjeta = raiz.querySelector('[data-whatsapp-tarjeta]');
  const cerrarBoton = raiz.querySelector('[data-whatsapp-cerrar]');

  function abrir() {
    tarjeta.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    tarjeta.querySelector('a')?.focus();
  }

  function cerrar(devolverFoco = true) {
    tarjeta.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    if (devolverFoco) {
      boton.focus();
    }
  }

  boton.addEventListener('click', () => (tarjeta.hidden ? abrir() : cerrar()));
  cerrarBoton.addEventListener('click', () => cerrar());
  raiz.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !tarjeta.hidden) {
      cerrar();
    }
  });
  document.addEventListener('click', (evento) => {
    if (!tarjeta.hidden && !raiz.contains(evento.target)) {
      cerrar(false);
    }
  });
}
