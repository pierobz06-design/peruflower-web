/**
 * Pagos del pedido (HU11):
 * 1. Tarjeta: pasarela simulada; si se aprueba, el pedido pasa a "Pagado" (solo se guardan los últimos 4 dígitos).
 * 2. Yape o Plin: se guarda el número de operación y el pedido queda "Pendiente" hasta que el personal lo confirme.
 * 3. WhatsApp: el pedido queda "Pendiente" y se arma el mensaje para la recepcionista.
 */
const { registrarPago } = require('../models/pedido-modelo');
const { procesarPagoTarjeta } = require('./pasarela-simulada');
const { crearEnlaceWhatsapp, mensajePedido } = require('../utils/whatsapp');
const { crearErrorVisible } = require('../utils/errores');
const negocio = require('../config/negocio');

function exigirPendiente(pedido) {
  if (pedido.estado !== 'Pendiente') {
    throw crearErrorVisible(`El pedido ${pedido.codigo} ya figura como ${pedido.estado}.`, 409);
  }
}

async function guardarPago(pedido, datosPago) {
  const actualizado = await registrarPago(pedido.id, datosPago);
  if (!actualizado) {
    throw crearErrorVisible(`El pedido ${pedido.codigo} ya no se puede modificar.`, 409);
  }
}

async function pagarConTarjeta(pedido, { numeroTarjeta }) {
  exigirPendiente(pedido);
  const resultado = await procesarPagoTarjeta({ numeroTarjeta, monto: pedido.total });
  if (resultado.aprobado) {
    await guardarPago(pedido, {
      metodo: 'tarjeta',
      ultimos4: resultado.ultimos4,
      estado: 'Pagado',
    });
  }
  return resultado;
}

async function registrarPagoBilletera(pedido, { billetera, codigoOperacion }) {
  exigirPendiente(pedido);
  await guardarPago(pedido, { metodo: billetera, codigoOperacion, estado: 'Pendiente' });
}

async function continuarPorWhatsapp(pedido) {
  exigirPendiente(pedido);
  await guardarPago(pedido, { metodo: 'whatsapp', estado: 'Pendiente' });
  return crearEnlaceWhatsapp(negocio.whatsappNumero, mensajePedido(pedido));
}

module.exports = { pagarConTarjeta, registrarPagoBilletera, continuarPorWhatsapp };
