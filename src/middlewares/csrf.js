const crypto = require('node:crypto');
const { crearErrorVisible } = require('../utils/errores');

/**
 * Protección CSRF con token sincronizado: cada sesión tiene un token secreto que
 * los formularios envían en "_csrf" y las peticiones fetch en la cabecera "X-CSRF-Token".
 */
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

function tokensIguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function proteccionCsrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  if (METODOS_SEGUROS.has(req.method)) {
    return next();
  }
  const tokenRecibido = req.get('X-CSRF-Token') || (req.body && req.body._csrf);
  if (tokenRecibido && tokensIguales(tokenRecibido, req.session.csrfToken)) {
    return next();
  }
  next(
    crearErrorVisible(
      'Tu sesión expiró o el formulario ya no es válido. Recarga la página e inténtalo otra vez.',
      403,
    ),
  );
}

module.exports = { proteccionCsrf };
