const mysql = require('mysql2/promise');
const config = require('./env');

// Pool de conexiones con promesas. Todas las consultas usan parámetros (?) para evitar inyección SQL.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  timezone: '-05:00',
});

async function verificarConexion() {
  const conexion = await pool.getConnection();
  try {
    await conexion.ping();
  } finally {
    conexion.release();
  }
}

module.exports = { pool, verificarConexion };
