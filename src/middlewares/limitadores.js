const { rateLimit } = require('express-rate-limit');
const { crearErrorVisible } = require('../utils/errores');

/** Limita los intentos de inicio de sesión y registro para frenar ataques de fuerza bruta. */
function crearLimitador({ minutos, maximo, mensaje }) {
  return rateLimit({
    windowMs: minutos * 60 * 1000,
    limit: maximo,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res, next) {
      next(crearErrorVisible(mensaje, 429));
    },
  });
}

const limitarAcceso = crearLimitador({
  minutos: 15,
  maximo: 10,
  mensaje: 'Hiciste demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',
});

const limitarApiCarrito = crearLimitador({
  minutos: 1,
  maximo: 60,
  mensaje: 'Demasiadas acciones en poco tiempo. Espera un momento.',
});

// Evita que se prueben muchas tarjetas seguidas (OWASP: card testing).
const limitarPagos = crearLimitador({
  minutos: 15,
  maximo: 15,
  mensaje: 'Hiciste demasiados intentos de pago. Espera 15 minutos o elige pagar por WhatsApp.',
});

module.exports = { limitarAcceso, limitarApiCarrito, limitarPagos };
