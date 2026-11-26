import { atraparFoco, bloquearScroll, obtenerEnfocables } from '../utils/panel.js';

const DURACION_CIERRE_MS = 400;

export function iniciarMenuMovil() {
  const menu = document.querySelector('[data-menu-movil]');
  const botonAbrir = document.querySelector('[data-abrir-menu]');
  if (!menu || !botonAbrir) {
    return;
  }
  const panel = menu.querySelector('.menu-movil__panel');
  let quitarTrampaFoco = null;

  function abrir() {
    menu.hidden = false;
    // Espera un cuadro para que la transición de entrada se vea.
    window.requestAnimationFrame(() => menu.classList.add('es-abierto'));
    botonAbrir.setAttribute('aria-expanded', 'true');
    bloquearScroll(true);
    quitarTrampaFoco = atraparFoco(panel, cerrar);
    obtenerEnfocables(panel)[0]?.focus();
  }

  function cerrar() {
    menu.classList.remove('es-abierto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    bloquearScroll(false);
    quitarTrampaFoco?.();
    window.setTimeout(() => {
      menu.hidden = true;
    }, DURACION_CIERRE_MS);
    botonAbrir.focus();
  }

  botonAbrir.addEventListener('click', abrir);
  menu.querySelectorAll('[data-cerrar-menu]').forEach((elemento) => {
    elemento.addEventListener('click', cerrar);
  });

  // Acordeones de "Ocasiones" y "Por presupuesto".
  menu.querySelectorAll('[data-acordeon]').forEach((boton) => {
    const lista = document.getElementById(boton.getAttribute('aria-controls'));
    boton.addEventListener('click', () => {
      const expandido = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!expandido));
      lista.hidden = expandido;
    });
  });
}
