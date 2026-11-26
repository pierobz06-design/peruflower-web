/**
 * Registro del pedido (HU08, HU09): valida el carrito contra la base de datos,
 * calcula el envío según el distrito y guarda el pedido en estado "Pendiente".
 */
const { obtenerZonaActiva } = require('../models/zona-modelo');
const { crearPedido } = require('../models/pedido-modelo');
const { obtenerResumenCarrito, vaciarCarrito, redondear } = require('./carrito-servicio');
const { crearErrorVisible } = require('../utils/errores');

async function registrarPedido(sesion, clienteId, entrega) {
  const carrito = await obtenerResumenCarrito(sesion);
  if (carrito.items.length === 0) {
    throw crearErrorVisible('Tu carrito está vacío. Agrega un arreglo para hacer tu pedido.');
  }
  if (carrito.hayNoDisponibles) {
    throw crearErrorVisible(
      'Algún arreglo de tu carrito ya no está disponible. Quítalo para continuar con tu pedido.',
    );
  }

  const zona = await obtenerZonaActiva(entrega.zonaEntregaId);
  if (!zona) {
    throw crearErrorVisible('Elige un distrito de entrega válido.');
  }

  const costoEnvio = Number(zona.costo);
  const pedido = await crearPedido(
    {
      clienteId,
      receptorNombre: entrega.receptorNombre,
      receptorTelefono: entrega.receptorTelefono,
      zonaEntregaId: zona.id,
      direccion: entrega.direccion,
      referencia: entrega.referencia || null,
      fechaEntrega: entrega.fechaEntrega,
      horarioEntrega: entrega.horarioEntrega,
      dedicatoria: entrega.dedicatoria || null,
      subtotal: carrito.subtotal,
      costoEnvio,
      total: redondear(carrito.subtotal + costoEnvio),
    },
    carrito.items.map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      precioUnitario: item.precio,
      cantidad: item.cantidad,
      subtotal: item.subtotal,
    })),
  );

  vaciarCarrito(sesion);
  return pedido;
}

module.exports = { registrarPedido };
