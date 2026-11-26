const {
  pagarConTarjeta,
  registrarPagoBilletera,
  continuarPorWhatsapp,
} = require('../services/pago-servicio');
const { TARJETAS_DE_PRUEBA } = require('../services/pasarela-simulada');
const { obtenerErrores } = require('../middlewares/validacion');
const { crearEnlaceWhatsapp, mensajePedido } = require('../utils/whatsapp');
const negocio = require('../config/negocio');

const rutaConfirmacion = (pedido) => `/pedido/${pedido.codigo}/confirmacion`;

function renderizarPago(req, res, opciones = {}) {
  const { metodoActivo = '', errores = {}, error = '', valores = {}, estado = 200 } = opciones;
  res.status(estado).render('pages/pago', {
    titulo: `Pagar pedido ${req.pedido.codigo} | Perú Flowers`,
    descripcion: 'Elige cómo pagar tu pedido de Perú Flowers.',
    estilos: ['pedido', 'pago'],
    scripts: ['formularios', 'pago'],
    pedido: req.pedido,
    yapePlin: negocio.yapePlin,
    tarjetasDePrueba: TARJETAS_DE_PRUEBA,
    metodoActivo,
    errores,
    error,
    valores,
  });
}

/** Si el pedido ya no está pendiente (por ejemplo, ya se pagó), se muestra su confirmación. */
function redirigirSiNoPendiente(req, res) {
  if (req.pedido.estado === 'Pendiente') {
    return false;
  }
  req.session.aviso = {
    tipo: 'info',
    texto: `El pedido ${req.pedido.codigo} ya está ${req.pedido.estado}.`,
  };
  res.redirect(rutaConfirmacion(req.pedido));
  return true;
}

function mostrarPago(req, res) {
  if (redirigirSiNoPendiente(req, res)) {
    return;
  }
  renderizarPago(req, res);
}

async function pagarTarjeta(req, res) {
  if (redirigirSiNoPendiente(req, res)) {
    return;
  }
  // Nunca se devuelve el número ni el CVV al formulario.
  const valores = { titularTarjeta: req.body.titularTarjeta, vencimiento: req.body.vencimiento };
  const errores = obtenerErrores(req);
  if (errores) {
    return renderizarPago(req, res, { metodoActivo: 'tarjeta', errores, valores, estado: 422 });
  }

  const resultado = await pagarConTarjeta(req.pedido, req.body);
  if (!resultado.aprobado) {
    return renderizarPago(req, res, {
      metodoActivo: 'tarjeta',
      error: `Pago rechazado: ${resultado.mensaje}`,
      valores,
      estado: 402,
    });
  }
  req.session.aviso = {
    tipo: 'exito',
    texto: `¡Pago aprobado! ${resultado.marca} terminada en ${resultado.ultimos4}.`,
  };
  res.redirect(rutaConfirmacion(req.pedido));
}

async function pagarBilletera(req, res) {
  if (redirigirSiNoPendiente(req, res)) {
    return;
  }
  const errores = obtenerErrores(req);
  if (errores) {
    return renderizarPago(req, res, {
      metodoActivo: 'billetera',
      errores,
      valores: req.body,
      estado: 422,
    });
  }
  await registrarPagoBilletera(req.pedido, req.body);
  req.session.aviso = {
    tipo: 'exito',
    texto: 'Recibimos tu número de operación. Te avisaremos cuando confirmemos el pago.',
  };
  res.redirect(rutaConfirmacion(req.pedido));
}

async function pagarWhatsapp(req, res) {
  if (redirigirSiNoPendiente(req, res)) {
    return;
  }
  const enlaceWhatsapp = await continuarPorWhatsapp(req.pedido);
  // Desde JavaScript se abre WhatsApp en otra pestaña; sin JavaScript, la confirmación tiene el botón.
  if (req.accepts(['html', 'json']) === 'json') {
    return res.json({ enlaceWhatsapp, confirmacion: rutaConfirmacion(req.pedido) });
  }
  res.redirect(rutaConfirmacion(req.pedido));
}

function mostrarConfirmacion(req, res) {
  const pedido = req.pedido;
  res.render('pages/confirmacion', {
    titulo: `Pedido ${pedido.codigo} confirmado | Perú Flowers`,
    descripcion: 'Confirmación de tu pedido en Perú Flowers.',
    estilos: ['pedido', 'pago'],
    pedido,
    enlaceWhatsappPedido:
      pedido.metodo_pago === 'whatsapp'
        ? crearEnlaceWhatsapp(negocio.whatsappNumero, mensajePedido(pedido))
        : null,
  });
}

module.exports = { mostrarPago, pagarTarjeta, pagarBilletera, pagarWhatsapp, mostrarConfirmacion };
