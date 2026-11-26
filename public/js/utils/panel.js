/**
 * Utilidades para paneles que se abren sobre la página (menú del celular, filtros):
 * bloquean el scroll del fondo, mantienen el foco dentro y se cierran con Escape.
 */
const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function obtenerEnfocables(contenedor) {
  return [...contenedor.querySelectorAll(SELECTOR_ENFOCABLES)].filter(
    (elemento) => elemento.offsetParent !== null,
  );
}

/** Mantiene la navegación con Tab dentro del contenedor. Devuelve la función para quitarlo. */
export function atraparFoco(contenedor, alPresionarEscape) {
  function manejarTecla(evento) {
    if (evento.key === 'Escape') {
      alPresionarEscape();
      return;
    }
    if (evento.key !== 'Tab') {
      return;
    }
    const enfocables = obtenerEnfocables(contenedor);
    if (enfocables.length === 0) {
      return;
    }
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
  document.addEventListener('keydown', manejarTecla);
  return () => document.removeEventListener('keydown', manejarTecla);
}

export function bloquearScroll(bloquear) {
  document.body.classList.toggle('sin-scroll', bloquear);
}
