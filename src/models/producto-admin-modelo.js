/**
 * Consultas del panel de administración para productos (HU05).
 * A diferencia de la tienda, aquí también se ven los productos ocultos.
 */
const { pool } = require('../config/database');
const { formatearPrecio } = require('../utils/formato');

async function listarProductosAdmin({ visibilidad, buscar } = {}) {
  const condiciones = [];
  const parametros = [];
  if (visibilidad === 'visibles') {
    condiciones.push('p.visible = 1');
  } else if (visibilidad === 'ocultos') {
    condiciones.push('p.visible = 0');
  }
  if (buscar) {
    condiciones.push('(p.nombre LIKE ? OR p.sku LIKE ?)');
    parametros.push(`%${buscar}%`, `%${buscar}%`);
  }
  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await pool.execute(
    `SELECT p.id, p.sku, p.nombre, p.slug, p.precio, p.precio_oferta, p.imagen, p.disponible,
            p.visible, p.updated_at, c.nombre AS categoria,
            GROUP_CONCAT(o.nombre ORDER BY o.orden SEPARATOR ', ') AS ocasiones
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
     LEFT JOIN categorias o ON o.id = pc.categoria_id
     ${donde}
     GROUP BY p.id
     ORDER BY p.visible DESC, p.id DESC`,
    parametros,
  );
  return filas.map((fila) => ({
    ...fila,
    miniatura: fila.imagen.replace('/img/productos/', '/img/productos/miniaturas/'),
    precioTexto: formatearPrecio(fila.precio),
    precioOfertaTexto: fila.precio_oferta ? formatearPrecio(fila.precio_oferta) : '',
  }));
}

async function contarProductos() {
  const [[fila]] = await pool.query(
    'SELECT SUM(visible = 1) AS visibles, SUM(visible = 0) AS ocultos, SUM(disponible = 0) AS agotados FROM productos',
  );
  return {
    visibles: Number(fila.visibles) || 0,
    ocultos: Number(fila.ocultos) || 0,
    agotados: Number(fila.agotados) || 0,
  };
}

async function obtenerProductoAdmin(id) {
  const [filas] = await pool.execute(
    `SELECT id, sku, nombre, slug, descripcion, precio, precio_oferta, categoria_id, imagen,
            disponible, visible
     FROM productos WHERE id = ?`,
    [id],
  );
  if (filas.length === 0) {
    return null;
  }
  const [ocasiones] = await pool.execute(
    'SELECT categoria_id FROM producto_categorias WHERE producto_id = ?',
    [id],
  );
  return { ...filas[0], ocasiones: ocasiones.map((fila) => fila.categoria_id) };
}

async function existeSku(sku, excluirId = 0) {
  const [filas] = await pool.execute('SELECT id FROM productos WHERE sku = ? AND id <> ?', [
    sku,
    excluirId,
  ]);
  return filas.length > 0;
}

async function existeSlug(slug) {
  const [filas] = await pool.execute('SELECT id FROM productos WHERE slug = ?', [slug]);
  return filas.length > 0;
}

/** Guarda las ocasiones del producto (la categoría principal siempre se incluye). */
async function guardarOcasiones(conexion, productoId, categoriaId, ocasiones) {
  const ids = [...new Set([categoriaId, ...ocasiones])];
  await conexion.execute('DELETE FROM producto_categorias WHERE producto_id = ?', [productoId]);
  for (const ocasionId of ids) {
    await conexion.execute(
      'INSERT INTO producto_categorias (producto_id, categoria_id) VALUES (?, ?)',
      [productoId, ocasionId],
    );
  }
}

async function enTransaccion(trabajo) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

function valoresProducto(datos) {
  return [
    datos.sku,
    datos.nombre,
    datos.descripcion,
    datos.precio,
    datos.precioOferta,
    datos.categoriaId,
    datos.imagen,
    datos.disponible ? 1 : 0,
    datos.visible ? 1 : 0,
  ];
}

async function crearProducto(datos) {
  return enTransaccion(async (conexion) => {
    const [resultado] = await conexion.execute(
      `INSERT INTO productos
         (sku, nombre, descripcion, precio, precio_oferta, categoria_id, imagen, disponible, visible, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...valoresProducto(datos), datos.slug],
    );
    await guardarOcasiones(conexion, resultado.insertId, datos.categoriaId, datos.ocasiones);
    return resultado.insertId;
  });
}

async function actualizarProducto(id, datos) {
  return enTransaccion(async (conexion) => {
    await conexion.execute(
      `UPDATE productos
       SET sku = ?, nombre = ?, descripcion = ?, precio = ?, precio_oferta = ?, categoria_id = ?,
           imagen = ?, disponible = ?, visible = ?
       WHERE id = ?`,
      [...valoresProducto(datos), id],
    );
    await guardarOcasiones(conexion, id, datos.categoriaId, datos.ocasiones);
  });
}

async function cambiarVisibilidad(id, visible) {
  const [resultado] = await pool.execute('UPDATE productos SET visible = ? WHERE id = ?', [
    visible ? 1 : 0,
    id,
  ]);
  return resultado.affectedRows === 1;
}

module.exports = {
  listarProductosAdmin,
  contarProductos,
  obtenerProductoAdmin,
  existeSku,
  existeSlug,
  crearProducto,
  actualizarProducto,
  cambiarVisibilidad,
};
