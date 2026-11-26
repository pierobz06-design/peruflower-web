const {
  agregarAlCarrito,
  actualizarCantidad,
  quitarDelCarrito,
  obtenerResumenCarrito,
} = require('../services/carrito-servicio');

async function mostrarCarrito(req, res) {
  const carrito = await obtenerResumenCarrito(req.session);
  res.render('pages/carrito', {
    titulo: 'Tu carrito | Perú Flowers',
    descripcion: 'Revisa los arreglos de tu carrito antes de hacer tu pedido.',
    estilos: ['pedido'],
    scripts: ['formularios'],
    carrito,
  });
}

// API JSON usada por el carrito lateral y la página del carrito (HU07).
async function apiObtenerCarrito(req, res) {
  res.json({ carrito: await obtenerResumenCarrito(req.session) });
}

async function apiAgregarProducto(req, res) {
  const producto = await agregarAlCarrito(req.session, req.body.productoId, req.body.cantidad);
  res.status(201).json({
    mensaje: `Agregaste "${producto.nombre}" a tu carrito.`,
    carrito: await obtenerResumenCarrito(req.session),
  });
}

async function apiActualizarCantidad(req, res) {
  actualizarCantidad(req.session, req.params.productoId, req.body.cantidad);
  res.json({ carrito: await obtenerResumenCarrito(req.session) });
}

async function apiQuitarProducto(req, res) {
  quitarDelCarrito(req.session, req.params.productoId);
  res.json({ carrito: await obtenerResumenCarrito(req.session) });
}

module.exports = {
  mostrarCarrito,
  apiObtenerCarrito,
  apiAgregarProducto,
  apiActualizarCantidad,
  apiQuitarProducto,
};
