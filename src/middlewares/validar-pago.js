const { body } = require('express-validator');
const { reglaNombre } = require('./validacion');
const {
  limpiarNumeroTarjeta,
  cumpleLuhn,
  longitudCvv,
  vencimientoValido,
} = require('../../public/js/utils/tarjeta.js');

// HU11 - Tarjeta (pasarela simulada): número validado con Luhn, titular, vencimiento y CVV.
const reglasTarjeta = [
  body('numeroTarjeta')
    .customSanitizer(limpiarNumeroTarjeta)
    .matches(/^\d{13,19}$/)
    .withMessage('Escribe el número completo de la tarjeta.')
    .bail()
    .custom(cumpleLuhn)
    .withMessage('El número de tarjeta no es válido. Revísalo.'),
  reglaNombre('titularTarjeta', 'el nombre como aparece en la tarjeta', { minimo: 3, maximo: 60 }),
  body('vencimiento')
    .trim()
    .custom((valor) => vencimientoValido(valor))
    .withMessage('Escribe un vencimiento válido (MM/AA) que no haya pasado.'),
  body('cvv')
    .trim()
    .custom((valor, { req }) =>
      new RegExp(`^\\d{${longitudCvv(req.body.numeroTarjeta)}}$`).test(valor),
    )
    .withMessage('Escribe el código de seguridad (CVV) de tu tarjeta.'),
];

// HU11 - Yape o Plin: número de operación para que el personal confirme el pago.
const reglasBilletera = [
  body('billetera').isIn(['yape', 'plin']).withMessage('Elige Yape o Plin.'),
  body('codigoOperacion')
    .customSanitizer((valor) => String(valor || '').replace(/\s/g, ''))
    .matches(/^\d{6,12}$/)
    .withMessage('Escribe el número de operación (entre 6 y 12 dígitos).'),
];

module.exports = { reglasTarjeta, reglasBilletera };
