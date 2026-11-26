import { pedirJson } from '../utils/api.js';
import { atraparFoco, bloquearScroll } from '../utils/panel.js';
import { mostrarAviso } from './avisos.js';

/**
 * Carrito de compras (HU07): agregar, quitar y cambiar cantidades.
 * El carrito vive en la sesión del servidor; aquí solo se muestra y se envían los cambios.
 */
const DURACION_CIERRE_MS = 400;
const panel = document.querySelector('[data-carrito-lateral]');
const plantillaItem = document.getElementById('plantilla-item-carrito');
let quitarTrampaFoco = null;
let elementoPrevio = null;

function actualizarContador(cantidad) {
  document.querySelectorAll('[data-contador-carrito]').forEach((contador) => {
    contador.textContent = cantidad;
    contador.hidden = cantidad === 0;
    contador
      .closest('a')
      ?.setAttribute(
        'aria-label',
        `Carrito de compras, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`,
      );
  });
}

function crearItem(item) {
  const elemento = plantillaItem.content.firstElementChild.cloneNode(true);
  elemento.dataset.productoId = item.productoId;
  elemento.classList.toggle('item-carrito--agotado', !item.disponible);
  elemento.querySelectorAll('[data-campo]').forEach((campo) => {
    campo.textContent = item[campo.dataset.campo];
  });
  elemento.querySelectorAll('[data-campo-enlace]').forEach((enlace) => {
    enlace.href = `/producto/${item.slug}`;
  });
  const imagen = elemento.querySelector('[data-campo-imagen]');
  imagen.src = item.miniatura;
  const cantidad = elemento.querySelector('[data-campo-cantidad]');
  cantidad.value = item.cantidad;
  cantidad.max = item.cantidadMaxima;
  elemento.querySelector('[data-campo-agotado]').hidden = item.disponible;
  return elemento;
}

/** Pinta el carrito en todas las listas de la página (panel lateral y página /carrito). */
function pintarCarrito(carrito) {
  const vacio = carrito.items.length === 0;
  document.querySelectorAll('[data-carrito-lista]').forEach((lista) => {
    lista.replaceChildren(
      ...carrito.items.map((item) =>
        crearItem({ ...item, cantidadMaxima: carrito.cantidadMaxima }),
      ),
    );
  });
  document.querySelectorAll('[data-carrito-vacio]').forEach((elemento) => {
    elemento.hidden = !vacio;
  });
  document.querySelectorAll('[data-carrito-con-items]').forEach((elemento) => {
    elemento.hidden = vacio;
  });
  document.querySelectorAll('[data-carrito-subtotal]').forEach((elemento) => {
    elemento.textContent = carrito.subtotalTexto;
  });
  document.querySelectorAll('[data-carrito-cantidad]').forEach((elemento) => {
    elemento.textContent = carrito.cantidadTotal;
  });
  document.querySelectorAll('[data-carrito-alerta-agotado]').forEach((elemento) => {
    elemento.hidden = !carrito.hayNoDisponibles;
  });
  // No se puede continuar si hay productos agotados.
  document.querySelectorAll('[data-ir-a-pagar]').forEach((boton) => {
    boton.classList.toggle('esta-deshabilitado', carrito.hayNoDisponibles);
    boton.setAttribute('aria-disabled', String(carrito.hayNoDisponibles));
  });
  actualizarContador(carrito.cantidadTotal);
}

async function abrirPanel() {
  if (!panel) {
    return;
  }
  elementoPrevio = document.activeElement;
  panel.hidden = false;
  window.requestAnimationFrame(() => panel.classList.add('es-abierto'));
  bloquearScroll(true);
  const contenido = panel.querySelector('.carrito-lateral__panel');
  quitarTrampaFoco = atraparFoco(contenido, cerrarPanel);
  panel.querySelector('[data-cerrar-carrito].boton-cerrar')?.focus();
  try {
    const { carrito } = await pedirJson('GET', '/api/carrito');
    pintarCarrito(carrito);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function cerrarPanel() {
  panel.classList.remove('es-abierto');
  bloquearScroll(false);
  quitarTrampaFoco?.();
  window.setTimeout(() => {
    panel.hidden = true;
  }, DURACION_CIERRE_MS);
  elementoPrevio?.focus();
}

async function cambiarCantidad(itemElemento, accion, valorEscrito) {
  const productoId = itemElemento.dataset.productoId;
  const actual = Number(itemElemento.querySelector('[data-campo-cantidad]').value) || 1;
  itemElemento.classList.add('esta-cargando');
  try {
    let respuesta;
    if (accion === 'quitar' || (accion === 'restar' && actual <= 1)) {
      respuesta = await pedirJson('DELETE', `/api/carrito/items/${productoId}`);
    } else {
      const nueva =
        accion === 'sumar' ? actual + 1 : accion === 'restar' ? actual - 1 : valorEscrito;
      respuesta = await pedirJson('PATCH', `/api/carrito/items/${productoId}`, { cantidad: nueva });
    }
    pintarCarrito(respuesta.carrito);
  } catch (error) {
    itemElemento.classList.remove('esta-cargando');
    mostrarAviso(error.message, 'error');
  }
}

/** Botones − y + del formulario "Agregar al carrito" de la página de producto. */
function iniciarSelectorCantidad(formulario) {
  const entrada = formulario.querySelector('input[name="cantidad"]');
  formulario.querySelectorAll('[data-paso]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const nueva = (Number(entrada.value) || 1) + Number(boton.dataset.paso);
      entrada.value = Math.min(Math.max(nueva, 1), Number(entrada.max) || 20);
    });
  });
}

function iniciarFormulariosAgregar() {
  document.querySelectorAll('[data-form-agregar]').forEach((formulario) => {
    iniciarSelectorCantidad(formulario);
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const boton = formulario.querySelector('[type="submit"]');
      boton.disabled = true;
      try {
        const respuesta = await pedirJson('POST', '/api/carrito/items', {
          productoId: Number(formulario.elements.productoId.value),
          cantidad: Number(formulario.elements.cantidad.value),
        });
        pintarCarrito(respuesta.carrito);
        mostrarAviso(respuesta.mensaje);
        await abrirPanel();
      } catch (error) {
        mostrarAviso(error.message, 'error');
      } finally {
        boton.disabled = false;
      }
    });
  });
}

function iniciarAccionesItems() {
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-item-carrito] button[data-accion]');
    if (boton) {
      cambiarCantidad(boton.closest('[data-item-carrito]'), boton.dataset.accion);
    }
  });
  document.addEventListener('change', (evento) => {
    const entrada = evento.target.closest('[data-item-carrito] [data-accion="cambiar"]');
    if (!entrada) {
      return;
    }
    const valor = Math.min(
      Math.max(Math.trunc(Number(entrada.value)) || 1, 1),
      Number(entrada.max),
    );
    cambiarCantidad(entrada.closest('[data-item-carrito]'), 'cambiar', valor);
  });
  // Evita continuar al pago si el carrito tiene productos agotados.
  document.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('[data-ir-a-pagar].esta-deshabilitado');
    if (enlace) {
      evento.preventDefault();
      mostrarAviso('Quita los arreglos que ya no están disponibles para continuar.', 'error');
    }
  });
}

export function iniciarCarrito() {
  if (panel) {
    document.querySelectorAll('[data-abrir-carrito]').forEach((enlace) => {
      enlace.addEventListener('click', (evento) => {
        evento.preventDefault();
        abrirPanel();
      });
    });
    panel.querySelectorAll('[data-cerrar-carrito]').forEach((elemento) => {
      elemento.addEventListener('click', cerrarPanel);
    });
  }
  iniciarFormulariosAgregar();
  iniciarAccionesItems();
}
