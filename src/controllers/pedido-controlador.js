const { listarZonasActivas } = require('../models/zona-modelo');
const { obtenerClientePorId } = require('../models/cliente-modelo');
const { obtenerResumenCarrito } = require('../services/carrito-servicio');
const { registrarPedido } = require('../services/pedido-servicio');
const { obtenerErrores } = require('../middlewares/validacion');
const { HORARIOS_ENTREGA, DIAS_MAXIMOS_ANTICIPACION } = require('../config/pedido');
const { fechaHoyLima, sumarDias } = require('../utils/fechas');

async function renderizarEntrega(req, res, { valores = {}, errores = {}, estado = 200 } = {}) {
  const [carrito, zonas, cliente] = await Promise.all([
    obtenerResumenCarrito(req.session),
    listarZonasActivas(),
    obtenerClientePorId(req.session.clienteId),
  ]);
  if (carrito.items.length === 0) {
    req.session.aviso = { tipo: 'info', texto: 'Tu carrito está vacío. Elige un arreglo primero.' };
    return res.redirect('/catalogo');
  }
  const hoy = fechaHoyLima();
  res.status(estado).render('pages/entrega', {
    titulo: 'Datos de entrega | Perú Flowers',
    descripcion: 'Completa los datos de entrega de tu pedido.',
    estilos: ['pedido'],
    scripts: ['formularios', 'entrega'],
    carrito,
    zonas,
    cliente,
    horarios: HORARIOS_ENTREGA,
    fechaMinima: hoy,
    fechaMaxima: sumarDias(hoy, DIAS_MAXIMOS_ANTICIPACION),
    valores,
    errores,
  });
}

function mostrarEntrega(req, res) {
  return renderizarEntrega(req, res);
}

async function registrarEntrega(req, res) {
  const errores = obtenerErrores(req);
  if (errores) {
    return renderizarEntrega(req, res, { valores: req.body, errores, estado: 422 });
  }
  try {
    const pedido = await registrarPedido(req.session, req.session.clienteId, req.body);
    req.session.aviso = {
      tipo: 'exito',
      texto: `Registramos tu pedido ${pedido.codigo}. Elige cómo quieres pagar.`,
    };
    res.redirect(`/pedido/${pedido.codigo}/pago`);
  } catch (error) {
    if (!error.expose) {
      throw error;
    }
    return renderizarEntrega(req, res, {
      valores: req.body,
      errores: { general: error.message },
      estado: error.status || 400,
    });
  }
}

module.exports = { mostrarEntrega, registrarEntrega };
