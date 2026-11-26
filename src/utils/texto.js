/**
 * Convierte un texto en un identificador para URL o nombre de archivo:
 * minúsculas, sin tildes ni espacios, separado por guiones. Ej: "Para Mamá" -> "para-mama".
 */
function crearSlug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&#?\w+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { crearSlug };
