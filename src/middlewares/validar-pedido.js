const { body } = require('express-validator');
const { reglaNombre, reglaCelular, limpiarTexto } = require('./validacion');
const { HORARIOS_ENTREGA, DIAS_MAXIMOS_ANTICIPACION } = require('../config/pedido');
const { fechaHoyLima, sumarDias } = require('../utils/fechas');

// HU08: datos de entrega con validaciones.
const reglasEntrega = [
  reglaNombre('receptorNombre', 'el nombre de quien recibe', { minimo: 3, maximo: 120 }),
  reglaCelular('receptorTelefono'),
  body('zonaEntregaId').isInt({ min: 1 }).withMessage('Elige el distrito de entrega.').toInt(),
  body('direccion')
    .customSanitizer(limpiarTexto)
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Escribe la dirección completa (entre 5 y 200 caracteres).'),
  body('referencia')
    .customSanitizer(limpiarTexto)
    .trim()
    .isLength({ max: 200 })
    .withMessage('La referencia puede tener hasta 200 caracteres.'),
  body('fechaEntrega')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Elige la fecha de entrega.')
    .bail()
    .custom((valor) => {
      const hoy = fechaHoyLima();
      return valor >= hoy && valor <= sumarDias(hoy, DIAS_MAXIMOS_ANTICIPACION);
    })
    .withMessage(`La fecha debe ser desde hoy y hasta ${DIAS_MAXIMOS_ANTICIPACION} días después.`),
  body('horarioEntrega').isIn(HORARIOS_ENTREGA).withMessage('Elige un horario de entrega.'),
  body('dedicatoria')
    .customSanitizer(limpiarTexto)
    .trim()
    .isLength({ max: 300 })
    .withMessage('La dedicatoria puede tener hasta 300 caracteres.'),
];

module.exports = { reglasEntrega };
