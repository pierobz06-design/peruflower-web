const { pool } = require('../config/database');

async function buscarClientePorEmail(email) {
  const [filas] = await pool.execute(
    'SELECT id, nombres, apellidos, email, telefono, password_hash FROM clientes WHERE email = ?',
    [email],
  );
  return filas[0] || null;
}

async function obtenerClientePorId(id) {
  const [filas] = await pool.execute(
    'SELECT id, nombres, apellidos, email, telefono FROM clientes WHERE id = ?',
    [id],
  );
  return filas[0] || null;
}

/** Registra al cliente guardando la aceptación de la política de privacidad y de promociones con su fecha. */
async function crearCliente({
  nombres,
  apellidos,
  email,
  telefono,
  passwordHash,
  aceptaPromociones,
}) {
  const [resultado] = await pool.execute(
    `INSERT INTO clientes
       (nombres, apellidos, email, telefono, password_hash,
        acepta_privacidad, fecha_acepta_privacidad, acepta_promociones, fecha_acepta_promociones)
     VALUES (?, ?, ?, ?, ?, 1, NOW(), ?, IF(? = 1, NOW(), NULL))`,
    [
      nombres,
      apellidos,
      email,
      telefono,
      passwordHash,
      aceptaPromociones ? 1 : 0,
      aceptaPromociones ? 1 : 0,
    ],
  );
  return resultado.insertId;
}

module.exports = { buscarClientePorEmail, obtenerClientePorId, crearCliente };
