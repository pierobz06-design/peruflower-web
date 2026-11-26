const { validationResult, body } = require('express-validator');

// Reglas compartidas por varios formularios.
const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;
const PATRON_CELULAR = /^9\d{8}$/;

/** Devuelve { campo: 'primer mensaje de error' } o null si todo está bien. */
function obtenerErrores(req) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) {
    return null;
  }
  const errores = {};
  for (const error of resultado.array()) {
    if (!errores[error.path]) {
      errores[error.path] = error.msg;
    }
  }
  return errores;
}

/** Quita espacios, guiones y el prefijo +51 de un teléfono peruano. */
function limpiarTelefono(valor) {
  return String(valor || '')
    .replace(/[\s-]/g, '')
    .replace(/^\+?51(?=9\d{8}$)/, '');
}

// Quita caracteres de control (tabulaciones y caracteres invisibles) de los textos libres;
// conserva los saltos de línea de la dedicatoria.
function limpiarTexto(valor) {
  return [...String(valor || '')]
    .filter((caracter) => {
      const codigo = caracter.charCodeAt(0);
      return caracter === '\n' || (codigo >= 32 && codigo !== 127);
    })
    .join('');
}

function reglaNombre(campo, etiqueta, { minimo = 2, maximo = 80 } = {}) {
  return body(campo)
    .trim()
    .notEmpty()
    .withMessage(`Escribe ${etiqueta}.`)
    .bail()
    .isLength({ min: minimo, max: maximo })
    .withMessage(
      `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} debe tener entre ${minimo} y ${maximo} caracteres.`,
    )
    .bail()
    .matches(PATRON_NOMBRE)
    .withMessage(`Usa solo letras y espacios en ${etiqueta}.`);
}

function reglaCelular(campo) {
  return body(campo)
    .customSanitizer(limpiarTelefono)
    .matches(PATRON_CELULAR)
    .withMessage('Escribe un celular válido de 9 dígitos que empiece con 9.');
}

module.exports = { obtenerErrores, reglaNombre, reglaCelular, limpiarTelefono, limpiarTexto };
