const { body } = require('express-validator');
const { reglaNombre, reglaCelular } = require('./validacion');

const reglaEmail = body('email')
  .trim()
  .toLowerCase()
  .notEmpty()
  .withMessage('Escribe tu correo electrónico.')
  .bail()
  .isLength({ max: 160 })
  .withMessage('El correo es demasiado largo.')
  .bail()
  .isEmail()
  .withMessage('Escribe un correo válido, por ejemplo nombre@correo.com.');

// HU06: registro con correo y aceptación obligatoria de la política de privacidad.
const reglasRegistro = [
  reglaNombre('nombres', 'tus nombres'),
  reglaNombre('apellidos', 'tus apellidos'),
  reglaEmail,
  reglaCelular('telefono'),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres.')
    .bail()
    .matches(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/)
    .withMessage('La contraseña debe tener al menos una letra.')
    .bail()
    .matches(/\d/)
    .withMessage('La contraseña debe tener al menos un número.'),
  body('confirmarPassword')
    .custom((valor, { req }) => valor === req.body.password)
    .withMessage('Las contraseñas no coinciden.'),
  body('aceptaPrivacidad')
    .equals('si')
    .withMessage('Para crear tu cuenta debes aceptar la política de privacidad.'),
  body('aceptaPromociones').optional().equals('si'),
];

const reglasIngreso = [
  reglaEmail,
  body('password').notEmpty().withMessage('Escribe tu contraseña.'),
];

module.exports = { reglasRegistro, reglasIngreso };
