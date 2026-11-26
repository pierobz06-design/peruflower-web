const { query, validationResult, matchedData } = require('express-validator');
const { LIMITE_PRECIO } = require('../config/catalogo');

const reglasFiltrosCatalogo = [
  query('ocasion').optional({ values: 'falsy' }).trim().isSlug().isLength({ max: 70 }),
  query('min').optional({ values: 'falsy' }).isInt({ min: 0, max: LIMITE_PRECIO }).toInt(),
  query('max').optional({ values: 'falsy' }).isInt({ min: 0, max: LIMITE_PRECIO }).toInt(),
];

/**
 * Deja en req.filtros solo los filtros válidos. Un valor manipulado en la URL
 * simplemente se ignora (no rompe la página).
 */
function prepararFiltros(req, res, next) {
  const camposConError = new Set(
    validationResult(req)
      .array()
      .map((error) => error.path),
  );
  const datos = matchedData(req, { locations: ['query'], onlyValidData: true });

  const filtros = {
    ocasion: camposConError.has('ocasion') ? undefined : datos.ocasion,
    precioMin: camposConError.has('min') ? undefined : datos.min,
    precioMax: camposConError.has('max') ? undefined : datos.max,
  };
  if (
    filtros.precioMin !== undefined &&
    filtros.precioMax !== undefined &&
    filtros.precioMin > filtros.precioMax
  ) {
    [filtros.precioMin, filtros.precioMax] = [filtros.precioMax, filtros.precioMin];
  }
  req.filtros = filtros;
  next();
}

const validarFiltrosCatalogo = [...reglasFiltrosCatalogo, prepararFiltros];

module.exports = { validarFiltrosCatalogo };
