const { Router } = require('express');
const cuenta = require('../controllers/admin-cuenta-controlador');
const panel = require('../controllers/admin-panel-controlador');
const productos = require('../controllers/admin-productos-controlador');
const pedidos = require('../controllers/admin-pedidos-controlador');
const { requiereAdmin } = require('../middlewares/autenticacion');
const { recibirImagenProducto } = require('../middlewares/subir-imagen');
const { limitarAcceso } = require('../middlewares/limitadores');
const {
  reglasIngresoAdmin,
  reglasProducto,
  reglasEstadoPedido,
  validarFiltrosPedidos,
} = require('../middlewares/validar-admin');

/**
 * Los formularios de producto se envían como multipart/form-data (llevan la foto).
 * Este router los lee ANTES de la protección CSRF para que el token del formulario
 * se pueda verificar; solo un administrador con sesión llega a leerlos.
 */
const subidasAdmin = Router();
subidasAdmin.post(
  ['/admin/productos', '/admin/productos/:id'],
  requiereAdmin,
  recibirImagenProducto,
);

const router = Router();

// Acceso al panel
router.get('/admin/ingresar', cuenta.mostrarIngreso);
router.post('/admin/ingresar', limitarAcceso, reglasIngresoAdmin, cuenta.ingresar);

router.use('/admin', requiereAdmin);
router.post('/admin/salir', cuenta.salir);
router.get('/admin', panel.mostrarResumen);

// HU05: productos
router.get('/admin/productos', productos.listar);
router.get('/admin/productos/nuevo', productos.mostrarNuevo);
router.post('/admin/productos', reglasProducto, productos.crear);
router.get('/admin/productos/:id/editar', productos.cargarProducto, productos.mostrarEditar);
router.post('/admin/productos/:id', productos.cargarProducto, reglasProducto, productos.actualizar);
router.post(
  '/admin/productos/:id/visibilidad',
  productos.cargarProducto,
  productos.alternarVisibilidad,
);

// HU10: pedidos
router.get('/admin/pedidos', validarFiltrosPedidos, pedidos.listar);
router.get('/admin/pedidos/:codigo', pedidos.cargarPedido, pedidos.mostrarDetalle);
router.post(
  '/admin/pedidos/:codigo/estado',
  pedidos.cargarPedido,
  reglasEstadoPedido,
  pedidos.actualizarEstado,
);

module.exports = { subidasAdmin, adminRutas: router };
