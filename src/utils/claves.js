const bcrypt = require('bcrypt');

const RONDAS_BCRYPT = 12;
// Hash de relleno: si el correo no existe se compara igual, para no revelar qué correos están registrados.
const HASH_RELLENO = bcrypt.hashSync('cuenta-inexistente-peru-flowers', RONDAS_BCRYPT);

function cifrarClave(clave) {
  return bcrypt.hash(clave, RONDAS_BCRYPT);
}

/** Compara la clave con el hash; si no hay usuario, compara con el relleno y devuelve false. */
async function claveCorrecta(clave, hashGuardado) {
  const coincide = await bcrypt.compare(String(clave || ''), hashGuardado || HASH_RELLENO);
  return Boolean(hashGuardado) && coincide;
}

module.exports = { cifrarClave, claveCorrecta };
