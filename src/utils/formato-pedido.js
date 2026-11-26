const { formatearPrecio } = require('./formato');
const { formatearFechaLarga } = require('./fechas');

const NOMBRES_METODO = {
  tarjeta: 'Tarjeta de débito o crédito',
  yape: 'Yape',
  plin: 'Plin',
  whatsapp: 'Coordinar por WhatsApp',
};

/** Prepara un pedido de la base para mostrarlo (montos, fecha y método en texto). */
function formatearPedido(pedido) {
  return {
    ...pedido,
    subtotalTexto: formatearPrecio(pedido.subtotal),
    costoEnvioTexto: formatearPrecio(pedido.costo_envio),
    totalTexto: formatearPrecio(pedido.total),
    fechaEntregaTexto: formatearFechaLarga(pedido.fecha_entrega),
    metodoPagoTexto: NOMBRES_METODO[pedido.metodo_pago] || 'Sin elegir',
    detalle: pedido.detalle.map((linea) => ({
      ...linea,
      miniatura: linea.imagen.replace('/img/productos/', '/img/productos/miniaturas/'),
      precioTexto: formatearPrecio(linea.precio_unitario),
      subtotalTexto: formatearPrecio(linea.subtotal),
    })),
  };
}

module.exports = { formatearPedido, NOMBRES_METODO };
