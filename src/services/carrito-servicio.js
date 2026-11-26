/**
 * Carrito de compras (HU07). Se guarda en la sesión del servidor (tabla "sessions"),
 * por eso se mantiene al recargar la página. Solo guarda id de producto y cantidad:
 * los precios siempre se leen de la base de datos.
 */
const { listarParaCarrito } = require('../models/producto-modelo');
const { formatearPrecio } = require('../utils/formato');
const { crearErrorVisible } = require('../utils/errores');
const { CANTIDAD_MAXIMA_POR_PRODUCTO, PRODUCTOS_MAXIMOS_EN_CARRITO } = require('../config/pedido');

function leerCarrito(sesion) {
  if (!sesion.carrito || typeof sesion.carrito !== 'object') {
    sesion.carrito = {};
  }
  return sesion.carrito;
}

function limitarCantidad(cantidad) {
  return Math.min(Math.max(Math.trunc(cantidad), 1), CANTIDAD_MAXIMA_POR_PRODUCTO);
}

function contarUnidades(sesion) {
  return Object.values(sesion.carrito || {}).reduce((total, cantidad) => total + cantidad, 0);
}

async function agregarAlCarrito(sesion, productoId, cantidad) {
  const [producto] = await listarParaCarrito([productoId]);
  if (!producto) {
    throw crearErrorVisible('Este arreglo ya no está disponible en el catálogo.', 404);
  }
  if (!producto.disponible) {
    throw crearErrorVisible('Por ahora este arreglo no está disponible para pedidos.');
  }
  const carrito = leerCarrito(sesion);
  if (!carrito[productoId] && Object.keys(carrito).length >= PRODUCTOS_MAXIMOS_EN_CARRITO) {
    throw crearErrorVisible('Tu carrito ya tiene el máximo de productos distintos permitidos.');
  }
  carrito[productoId] = limitarCantidad((carrito[productoId] || 0) + cantidad);
  return producto;
}

function actualizarCantidad(sesion, productoId, cantidad) {
  const carrito = leerCarrito(sesion);
  if (!carrito[productoId]) {
    throw crearErrorVisible('Ese producto ya no está en tu carrito.', 404);
  }
  carrito[productoId] = limitarCantidad(cantidad);
}

function quitarDelCarrito(sesion, productoId) {
  delete leerCarrito(sesion)[productoId];
}

function vaciarCarrito(sesion) {
  sesion.carrito = {};
}

const redondear = (monto) => Math.round(monto * 100) / 100;

/** Arma el detalle del carrito con precios actuales. Quita productos que fueron ocultados. */
async function obtenerResumenCarrito(sesion) {
  const carrito = leerCarrito(sesion);
  const ids = Object.keys(carrito).map(Number);
  const productos = await listarParaCarrito(ids);
  const porId = new Map(productos.map((producto) => [producto.id, producto]));

  for (const id of ids) {
    if (!porId.has(id)) {
      delete carrito[id];
    }
  }

  const items = ids
    .filter((id) => porId.has(id))
    .map((id) => {
      const producto = porId.get(id);
      const cantidad = carrito[id];
      const subtotal = redondear(producto.precioFinal * cantidad);
      return {
        productoId: producto.id,
        nombre: producto.nombre,
        slug: producto.slug,
        miniatura: producto.miniatura,
        disponible: producto.disponible,
        precio: producto.precioFinal,
        precioTexto: producto.precioTexto,
        cantidad,
        subtotal,
        subtotalTexto: formatearPrecio(subtotal),
      };
    });

  const subtotal = redondear(
    items.filter((item) => item.disponible).reduce((total, item) => total + item.subtotal, 0),
  );
  return {
    items,
    cantidadTotal: items.reduce((total, item) => total + item.cantidad, 0),
    subtotal,
    subtotalTexto: formatearPrecio(subtotal),
    hayNoDisponibles: items.some((item) => !item.disponible),
    cantidadMaxima: CANTIDAD_MAXIMA_POR_PRODUCTO,
  };
}

module.exports = {
  agregarAlCarrito,
  actualizarCantidad,
  quitarDelCarrito,
  vaciarCarrito,
  contarUnidades,
  obtenerResumenCarrito,
  redondear,
};
