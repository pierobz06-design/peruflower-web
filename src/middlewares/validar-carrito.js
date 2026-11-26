const { body, param } = require('express-validator');
const { obtenerErrores } = require('./validacion');
const { CANTIDAD_MAXIMA_POR_PRODUCTO } = require('../config/pedido');
const { crearErrorVisible } = require('../utils/errores');

const reglaCantidad = body('cantidad')
  .isInt({ min: 1, max: CANTIDAD_MAXIMA_POR_PRODUCTO })
  .withMessage(`La cantidad debe ser entre 1 y ${CANTIDAD_MAXIMA_POR_PRODUCTO}.`)
  .toInt();

const reglaProductoId = body('productoId')
  .isInt({ min: 1 })
  .withMessage('Producto no válido.')
  .toInt();

const reglaIdEnRuta = param('productoId')
  .isInt({ min: 1 })
  .withMessage('Producto no válido.')
  .toInt();

/** En la API del carrito un dato inválido responde 400 con el primer mensaje. */
function rechazarSiHayErrores(req, res, next) {
  const errores = obtenerErrores(req);
  if (errores) {
    return next(crearErrorVisible(Object.values(errores)[0], 400));
  }
  next();
}

const validarAgregar = [reglaProductoId, reglaCantidad, rechazarSiHayErrores];
const validarActualizar = [reglaIdEnRuta, reglaCantidad, rechazarSiHayErrores];
const validarQuitar = [reglaIdEnRuta, rechazarSiHayErrores];

module.exports = { validarAgregar, validarActualizar, validarQuitar };
