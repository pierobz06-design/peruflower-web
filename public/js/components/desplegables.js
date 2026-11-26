/**
 * Menús desplegables (Mi cuenta y "Por presupuesto").
 * Se abren con clic o teclado; los marcados con data-desplegable-hover también al pasar el mouse.
 */
function crearDesplegable(contenedor) {
  const boton = contenedor.querySelector('[data-desplegable-boton]');
  const menu = contenedor.querySelector('[data-desplegable-menu]');
  if (!boton || !menu) {
    return null;
  }

  function abrir() {
    contenedor.classList.add('es-abierto');
    boton.setAttribute('aria-expanded', 'true');
  }

  function cerrar() {
    contenedor.classList.remove('es-abierto');
    boton.setAttribute('aria-expanded', 'false');
  }

  const estaAbierto = () => contenedor.classList.contains('es-abierto');

  boton.addEventListener('click', () => (estaAbierto() ? cerrar() : abrir()));

  contenedor.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && estaAbierto()) {
      cerrar();
      boton.focus();
    }
  });

  // Se cierra cuando el foco sale del menú (navegación con Tab).
  contenedor.addEventListener('focusout', (evento) => {
    if (!contenedor.contains(evento.relatedTarget)) {
      cerrar();
    }
  });

  if (contenedor.hasAttribute('data-desplegable-hover')) {
    const puedeHover = window.matchMedia('(hover: hover)');
    contenedor.addEventListener('mouseenter', () => puedeHover.matches && abrir());
    contenedor.addEventListener('mouseleave', () => puedeHover.matches && cerrar());
  }

  return { contenedor, cerrar };
}

export function iniciarDesplegables() {
  const desplegables = [...document.querySelectorAll('[data-desplegable]')]
    .map(crearDesplegable)
    .filter(Boolean);

  document.addEventListener('click', (evento) => {
    for (const desplegable of desplegables) {
      if (!desplegable.contenedor.contains(evento.target)) {
        desplegable.cerrar();
      }
    }
  });
}
