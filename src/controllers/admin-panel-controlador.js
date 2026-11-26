const { contarPedidosPorEstado, listarPedidosAdmin } = require('../models/pedido-admin-modelo');
const { contarProductos } = require('../models/producto-admin-modelo');
const { formatearPrecio } = require('../utils/formato');

async function mostrarResumen(req, res) {
  const [pedidos, productos, ultimos] = await Promise.all([
    contarPedidosPorEstado(),
    contarProductos(),
    listarPedidosAdmin({ tipoFecha: 'pedido' }, 1),
  ]);
  res.render('admin/resumen', {
    titulo: 'Resumen | Panel Perú Flowers',
    seccion: 'resumen',
    pedidos,
    productos,
    montoCobradoTexto: formatearPrecio(pedidos.montoCobrado),
    ultimosPedidos: ultimos.pedidos.slice(0, 6),
  });
}

module.exports = { mostrarResumen };
