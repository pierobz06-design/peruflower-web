/**
 * npm run db:vaciar-pedidos -- --confirmar
 * Borra TODOS los clientes, pedidos y sesiones para empezar desde cero.
 * Conserva productos, ocasiones, zonas de entrega y administradores. Los contadores vuelven a 1
 * (el siguiente pedido será PF-000001).
 */
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function vaciar() {
  if (!process.argv.includes('--confirmar')) {
    console.log('Esto borrará TODOS los clientes, pedidos y sesiones de la base.');
    console.log('Si estás seguro, ejecuta: npm run db:vaciar-pedidos -- --confirmar');
    return;
  }
  const conexion = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
  try {
    await conexion.beginTransaction();
    const [detalle] = await conexion.query('DELETE FROM detalle_pedido');
    const [pedidos] = await conexion.query('DELETE FROM pedidos');
    const [clientes] = await conexion.query('DELETE FROM clientes');
    await conexion.query('DELETE FROM sessions');
    await conexion.commit();
    for (const tabla of ['detalle_pedido', 'pedidos', 'clientes']) {
      await conexion.query(`ALTER TABLE \`${tabla}\` AUTO_INCREMENT = 1`);
    }
    console.log(
      `Borrados: ${pedidos.affectedRows} pedidos, ${detalle.affectedRows} líneas de detalle y ${clientes.affectedRows} clientes.`,
    );
    console.log(
      '  Reinicia el servidor (Ctrl + C y npm run dev) para cerrar las sesiones abiertas.',
    );
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    await conexion.end();
  }
}

vaciar().catch((error) => {
  console.error('No se pudo vaciar:', error.message);
  process.exitCode = 1;
});
