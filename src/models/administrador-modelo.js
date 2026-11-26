const { pool } = require('../config/database');

async function buscarAdministradorPorEmail(email) {
  const [filas] = await pool.execute(
    'SELECT id, nombre, email, password_hash FROM administradores WHERE email = ? AND activo = 1',
    [email],
  );
  return filas[0] || null;
}

async function registrarAcceso(id) {
  await pool.execute('UPDATE administradores SET ultimo_acceso = NOW() WHERE id = ?', [id]);
}

module.exports = { buscarAdministradorPorEmail, registrarAcceso };
