const { pool } = require('../config/database');

async function listarZonasActivas() {
  const [filas] = await pool.query(
    `SELECT id, distrito, provincia, costo, es_referencial
     FROM zonas_entrega WHERE activo = 1
     ORDER BY provincia = 'Callao', distrito`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    distrito: fila.distrito,
    provincia: fila.provincia,
    costo: fila.costo,
    esReferencial: Boolean(fila.es_referencial),
  }));
}

async function obtenerZonaActiva(id) {
  const [filas] = await pool.execute(
    'SELECT id, distrito, provincia, costo FROM zonas_entrega WHERE id = ? AND activo = 1',
    [id],
  );
  return filas[0] || null;
}

module.exports = { listarZonasActivas, obtenerZonaActiva };
