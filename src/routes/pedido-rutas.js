const { Router } = require('express');
const pedido = require('../controllers/pedido-controlador');
const pago = require('../controllers/pago-controlador');
const { reglasEntrega } = require('../middlewares/validar-pedido');
const { reglasTarjeta, reglasBilletera } = require('../middlewares/validar-pago');
const { requiereCliente } = require('../middlewares/autenticacion');
const { cargarPedidoDelCliente } = require('../middlewares/cargar-pedido');
const { limitarPagos } = require('../middlewares/limitadores');

const router = Router();

router.use('/pedido', requiereCliente);

// HU08-HU09: datos de entrega y registro del pedido
router.get('/pedido/entrega', pedido.mostrarEntrega);
router.post('/pedido/entrega', reglasEntrega, pedido.registrarEntrega);

// HU11: pago del pedido y confirmación
router.get('/pedido/:codigo/pago', cargarPedidoDelCliente, pago.mostrarPago);
router.post(
  '/pedido/:codigo/pago/tarjeta',
  limitarPagos,
  cargarPedidoDelCliente,
  reglasTarjeta,
  pago.pagarTarjeta,
);
router.post(
  '/pedido/:codigo/pago/billetera',
  limitarPagos,
  cargarPedidoDelCliente,
  reglasBilletera,
  pago.pagarBilletera,
);
router.post('/pedido/:codigo/pago/whatsapp', cargarPedidoDelCliente, pago.pagarWhatsapp);
router.get('/pedido/:codigo/confirmacion', cargarPedidoDelCliente, pago.mostrarConfirmacion);

module.exports = router;
