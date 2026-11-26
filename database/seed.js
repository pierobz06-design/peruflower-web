/**
 * Datos iniciales: ocasiones, zonas de entrega, los 37 productos y el administrador de prueba.
 * Es idempotente: si se ejecuta otra vez no duplica registros ni pisa los cambios hechos en el panel.
 */
const { cifrarClave } = require('../src/utils/claves');
const categorias = require('./data/categorias.json');
const zonasEntrega = require('./data/zonas-entrega.json');
const productos = require('./data/productos.json');

async function cargarCategorias(conexion) {
  for (const categoria of categorias) {
    await conexion.execute(
      `INSERT INTO categorias (nombre, slug, descripcion, imagen, orden)
       VALUES (?, ?, ?, ?, ?) AS nueva
       ON DUPLICATE KEY UPDATE descripcion = nueva.descripcion, imagen = nueva.imagen,
         orden = nueva.orden`,
      [categoria.nombre, categoria.slug, categoria.descripcion, categoria.imagen, categoria.orden],
    );
  }
  const [filas] = await conexion.query('SELECT id, nombre FROM categorias');
  return new Map(filas.map((fila) => [fila.nombre, fila.id]));
}

async function cargarZonasEntrega(conexion) {
  for (const zona of zonasEntrega) {
    await conexion.execute(
      `INSERT INTO zonas_entrega (distrito, provincia, costo, es_referencial)
       VALUES (?, ?, ?, 1) AS nueva
       ON DUPLICATE KEY UPDATE provincia = nueva.provincia`,
      [zona.distrito, zona.provincia, zona.costo],
    );
  }
}

async function cargarProductos(conexion, idsCategoria) {
  let insertados = 0;
  for (const producto of productos) {
    const [resultado] = await conexion.execute(
      `INSERT IGNORE INTO productos
         (id, sku, nombre, slug, descripcion, precio, precio_oferta, categoria_id, imagen, disponible, visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        producto.id,
        producto.sku,
        producto.nombre,
        producto.slug,
        producto.descripcion,
        producto.precio,
        producto.precioOferta,
        idsCategoria.get(producto.categoria),
        producto.imagen,
        producto.disponible ? 1 : 0,
      ],
    );
    insertados += resultado.affectedRows;
    for (const ocasion of producto.ocasiones) {
      await conexion.execute(
        'INSERT IGNORE INTO producto_categorias (producto_id, categoria_id) VALUES (?, ?)',
        [producto.id, idsCategoria.get(ocasion)],
      );
    }
  }
  return insertados;
}

async function cargarAdministrador(conexion, admin) {
  if (!admin.password || admin.password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres en el archivo .env');
  }
  const [existentes] = await conexion.execute('SELECT id FROM administradores WHERE email = ?', [
    admin.email,
  ]);
  if (existentes.length > 0) {
    return false;
  }
  const passwordHash = await cifrarClave(admin.password);
  await conexion.execute(
    'INSERT INTO administradores (nombre, email, password_hash) VALUES (?, ?, ?)',
    [admin.nombre, admin.email, passwordHash],
  );
  return true;
}

async function cargarDatosIniciales(conexion, admin) {
  await conexion.beginTransaction();
  try {
    const idsCategoria = await cargarCategorias(conexion);
    await cargarZonasEntrega(conexion);
    const productosNuevos = await cargarProductos(conexion, idsCategoria);
    const adminCreado = await cargarAdministrador(conexion, admin);
    await conexion.commit();
    return { productosNuevos, adminCreado };
  } catch (error) {
    await conexion.rollback();
    throw error;
  }
}

module.exports = { cargarDatosIniciales, productos };
