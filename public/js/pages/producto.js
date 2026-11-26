import { prefiereMenosMovimiento } from '../utils/movimiento.js';

/** Zoom de la foto del producto que sigue al cursor (solo con mouse y sin "reducir movimiento"). */
function iniciarZoom() {
  const contenedor = document.querySelector('[data-zoom]');
  const tieneMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!contenedor || !tieneMouse || prefiereMenosMovimiento()) {
    return;
  }

  contenedor.addEventListener('mouseenter', () => contenedor.classList.add('esta-ampliada'));
  contenedor.addEventListener('mouseleave', () => contenedor.classList.remove('esta-ampliada'));
  contenedor.addEventListener('mousemove', (evento) => {
    const area = contenedor.getBoundingClientRect();
    const x = ((evento.clientX - area.left) / area.width) * 100;
    const y = ((evento.clientY - area.top) / area.height) * 100;
    contenedor.style.setProperty('--zoom-x', `${x}%`);
    contenedor.style.setProperty('--zoom-y', `${y}%`);
  });
}

iniciarZoom();
