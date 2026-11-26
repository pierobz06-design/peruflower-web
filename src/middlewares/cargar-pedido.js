const { obtenerPedidoDeCliente } = require('../models/pedido-modelo');
const { formatearPedido } = require('../utils/formato-pedido');

/**
 * Carga el pedido de la URL (/pedido/PF-000001/...) solo si pertenece al cliente con sesión.
 * Si no existe o es de otra persona, responde 404 (no revela que exista).
 */
async function cargarPedidoDelCliente(req, res, next) {
  const codigo = String(req.params.codigo || '');
  if (!/^PF-\d{6}$/.test(codigo)) {
    return next('route');
  }
  const pedido = await obtenerPedidoDeCliente(codigo, req.session.clienteId);
  if (!pedido) {
    return next('route');
  }
  req.pedido = formatearPedido(pedido);
  next();
}

module.exports = { cargarPedidoDelCliente };
