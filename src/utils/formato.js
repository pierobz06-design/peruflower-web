// El formato de precios se comparte con el navegador (public/js/utils/formato.js).
const { formatearPrecio } = require('../../public/js/utils/formato.js');

/** Separa la descripción guardada en la base (una característica por línea) en una lista. */
function separarLineas(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);
}

module.exports = { formatearPrecio, separarLineas };
