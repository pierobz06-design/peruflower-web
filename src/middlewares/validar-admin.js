const { body, query, validationResult, matchedData } = require('express-validator');
const { limpiarTexto } = require('./validacion');

const PATRON_PRECIO = /^\d{1,5}(\.\d{1,2})?$/;
const ESTADOS_PEDIDO = ['Pendiente', 'Pagado', 'Entregado'];

const reglasIngresoAdmin = [
  body('email').trim().toLowerCase().isEmail().withMessage('Escribe un correo válido.'),
  body('password').notEmpty().withMessage('Escribe tu contraseña.'),
];

// HU05: datos del producto
const reglasProducto = [
  body('nombre')
    .customSanitizer(limpiarTexto)
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres.'),
  body('sku')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('El código (SKU) debe tener entre 2 y 30 caracteres.')
    .bail()
    .matches(/^[A-Za-z0-9][A-Za-z0-9 –-]*$/)
    .withMessage('Usa solo letras, números, espacios y guiones en el código.'),
  body('descripcion')
    .customSanitizer(limpiarTexto)
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Describe el arreglo (entre 10 y 2000 caracteres).'),
  body('precio')
    .trim()
    .matches(PATRON_PRECIO)
    .withMessage('Escribe un precio válido, por ejemplo 135 o 135.50.')
    .bail()
    .toFloat()
    .isFloat({ min: 1, max: 10000 })
    .withMessage('El precio debe estar entre S/ 1 y S/ 10,000.'),
  body('precioOferta')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PATRON_PRECIO)
    .withMessage('Escribe un precio de oferta válido o déjalo vacío.')
    .bail()
    .toFloat()
    .custom((valor, { req }) => valor > 0 && valor < Number(req.body.precio))
    .withMessage('El precio de oferta debe ser menor que el precio regular.'),
  body('categoriaId').isInt({ min: 1 }).withMessage('Elige la categoría principal.').toInt(),
  body('ocasiones').customSanitizer((valor) =>
    []
      .concat(valor || [])
      .map(Number)
      .filter((numero) => Number.isInteger(numero) && numero > 0),
  ),
  body('disponible').customSanitizer((valor) => valor === 'si'),
  body('visible').customSanitizer((valor) => valor === 'si'),
];

// HU10: cambio de estado del pedido
const reglasEstadoPedido = [
  body('estado').isIn(ESTADOS_PEDIDO).withMessage('Elige un estado válido.'),
];

/** Filtros de la lista de pedidos: los valores inválidos simplemente se ignoran. */
const reglasFiltrosPedidos = [
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_PEDIDO),
  query('tipoFecha').optional({ values: 'falsy' }).isIn(['pedido', 'entrega']),
  query('desde').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  query('hasta').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  query('buscar').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  query('pagina').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000 }).toInt(),
];

function prepararFiltrosPedidos(req, res, next) {
  const conError = new Set(
    validationResult(req)
      .array()
      .map((error) => error.path),
  );
  const datos = matchedData(req, { locations: ['query'], onlyValidData: true });
  const valor = (campo) => (conError.has(campo) ? undefined : datos[campo]);
  req.filtros = {
    estado: valor('estado'),
    tipoFecha: valor('tipoFecha') || 'pedido',
    desde: valor('desde'),
    hasta: valor('hasta'),
    buscar: valor('buscar'),
  };
  req.pagina = valor('pagina') || 1;
  next();
}

const validarFiltrosPedidos = [...reglasFiltrosPedidos, prepararFiltrosPedidos];

module.exports = {
  reglasIngresoAdmin,
  reglasProducto,
  reglasEstadoPedido,
  validarFiltrosPedidos,
  ESTADOS_PEDIDO,
};
