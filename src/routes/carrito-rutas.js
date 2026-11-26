const { Router } = require('express');
const carrito = require('../controllers/carrito-controlador');
const {
  validarAgregar,
  validarActualizar,
  validarQuitar,
} = require('../middlewares/validar-carrito');
const { limitarApiCarrito } = require('../middlewares/limitadores');

const router = Router();

router.get('/carrito', carrito.mostrarCarrito);

router.use('/api/carrito', limitarApiCarrito);
router.get('/api/carrito', carrito.apiObtenerCarrito);
router.post('/api/carrito/items', validarAgregar, carrito.apiAgregarProducto);
router.patch('/api/carrito/items/:productoId', validarActualizar, carrito.apiActualizarCantidad);
router.delete('/api/carrito/items/:productoId', validarQuitar, carrito.apiQuitarProducto);

module.exports = router;
