// Header fijo: se compacta y gana sombra al bajar en la página.
const DISTANCIA_COMPACTO = 40;

export function iniciarEncabezado() {
  const encabezado = document.querySelector('[data-encabezado]');
  if (!encabezado) {
    return;
  }

  let pendiente = false;
  function actualizar() {
    encabezado.classList.toggle('es-compacto', window.scrollY > DISTANCIA_COMPACTO);
    pendiente = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!pendiente) {
        pendiente = true;
        window.requestAnimationFrame(actualizar);
      }
    },
    { passive: true },
  );
  actualizar();
}
