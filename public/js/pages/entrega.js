import { formatearPrecio } from '../utils/formato.js';

/** HU09: al elegir el distrito se muestra el costo de envío y el total al instante. */
function iniciarCostoEnvio() {
  const selector = document.querySelector('[data-selector-distrito]');
  const subtotalElemento = document.querySelector('[data-subtotal]');
  const envio = document.querySelector('[data-envio]');
  const total = document.querySelector('[data-total]');
  const distrito = document.querySelector('[data-distrito-elegido]');
  if (!selector || !subtotalElemento) {
    return;
  }
  const subtotal = Number(subtotalElemento.dataset.subtotal);

  function actualizar() {
    const opcion = selector.selectedOptions[0];
    const costo = opcion && opcion.value ? Number(opcion.dataset.costo) : null;
    envio.textContent = costo === null ? 'Elige un distrito' : formatearPrecio(costo);
    distrito.textContent = costo === null ? '' : `(${opcion.textContent.split(' · ')[0]})`;
    total.textContent = formatearPrecio(subtotal + (costo || 0));
    total.closest('.resumen-compra__fila')?.classList.remove('es-actualizado');
    void total.offsetWidth;
    total.closest('.resumen-compra__fila')?.classList.add('es-actualizado');
  }

  selector.addEventListener('change', actualizar);
}

/** "Lo recibo yo": completa nombre y celular con los datos del cliente. */
function iniciarLoReciboYo() {
  const casilla = document.querySelector('[data-lo-recibo]');
  const nombre = document.getElementById('receptorNombre');
  const telefono = document.getElementById('receptorTelefono');
  if (!casilla || !nombre || !telefono) {
    return;
  }
  casilla.addEventListener('change', () => {
    nombre.value = casilla.checked ? casilla.dataset.nombre : '';
    telefono.value = casilla.checked ? casilla.dataset.telefono : '';
    nombre.dispatchEvent(new Event('blur'));
  });
}

iniciarCostoEnvio();
iniciarLoReciboYo();
