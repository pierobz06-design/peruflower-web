const {
  listarPedidosAdmin,
  obtenerPedidoAdmin,
  cambiarEstadoPedido,
} = require('../models/pedido-admin-modelo');
const { ESTADOS_PEDIDO } = require('../middlewares/validar-admin');
const { obtenerErrores } = require('../middlewares/validacion');
const { formatearPedido, NOMBRES_METODO } = require('../utils/formato-pedido');
const { formatearPrecio } = require('../utils/formato');
const { formatearFechaLarga } = require('../utils/fechas');
const { crearEnlaceWhatsapp } = require('../utils/whatsapp');

/** Arma la URL de la lista conservando los filtros (para la paginación). */
function enlaceConFiltros(filtros, pagina) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor && !(clave === 'tipoFecha' && valor === 'pedido')) {
      parametros.set(clave, valor);
    }
  }
  if (pagina > 1) {
    parametros.set('pagina', pagina);
  }
  const consulta = parametros.toString();
  return consulta ? `/admin/pedidos?${consulta}` : '/admin/pedidos';
}

// HU10: lista de pedidos con filtros por estado y fecha.
async function listar(req, res) {
  const { pedidos, total, paginas } = await listarPedidosAdmin(req.filtros, req.pagina);
  res.render('admin/pedidos', {
    titulo: 'Pedidos | Panel Perú Flowers',
    seccion: 'pedidos',
    pedidos: pedidos.map((pedido) => ({
      ...pedido,
      totalTexto: formatearPrecio(pedido.total),
      fechaEntregaTexto: formatearFechaLarga(pedido.fecha_entrega),
      metodoPagoTexto: NOMBRES_METODO[pedido.metodo_pago] || 'Sin elegir',
    })),
    total,
    paginas,
    pagina: req.pagina,
    filtros: req.filtros,
    estados: ESTADOS_PEDIDO,
    enlacePagina: (numero) => enlaceConFiltros(req.filtros, numero),
    hayFiltros: Boolean(
      req.filtros.estado || req.filtros.desde || req.filtros.hasta || req.filtros.buscar,
    ),
  });
}

async function cargarPedido(req, res, next) {
  const codigo = String(req.params.codigo || '');
  const pedido = /^PF-\d{6}$/.test(codigo) ? await obtenerPedidoAdmin(codigo) : null;
  if (!pedido) {
    return next('route');
  }
  req.pedido = formatearPedido(pedido);
  next();
}

function mostrarDetalle(req, res) {
  const pedido = req.pedido;
  res.render('admin/pedido-detalle', {
    titulo: `Pedido ${pedido.codigo} | Panel Perú Flowers`,
    seccion: 'pedidos',
    pedido,
    estados: ESTADOS_PEDIDO,
    enlaceCliente: crearEnlaceWhatsapp(
      `51${pedido.cliente_telefono}`,
      `Hola ${pedido.cliente_nombres}, te escribimos de Perú Flowers por tu pedido ${pedido.codigo}.`,
    ),
  });
}

// HU10: cambio de estado (Pendiente, Pagado, Entregado).
async function actualizarEstado(req, res) {
  const pedido = req.pedido;
  if (obtenerErrores(req)) {
    req.session.aviso = { tipo: 'error', texto: 'Elige un estado válido.' };
  } else if (req.body.estado === pedido.estado) {
    req.session.aviso = { tipo: 'info', texto: `El pedido ya estaba ${pedido.estado}.` };
  } else {
    await cambiarEstadoPedido(pedido.codigo, req.body.estado);
    req.session.aviso = {
      tipo: 'exito',
      texto: `Pedido ${pedido.codigo}: ${pedido.estado} → ${req.body.estado}.`,
    };
  }
  res.redirect(`/admin/pedidos/${pedido.codigo}`);
}

module.exports = { listar, cargarPedido, mostrarDetalle, actualizarEstado };
