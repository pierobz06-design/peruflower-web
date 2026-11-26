const { pool } = require('../config/database');

async function listarCategorias() {
  const [filas] = await pool.query(
    `SELECT c.id, c.nombre, c.slug, c.descripcion, c.imagen,
            COUNT(p.id) AS total_productos
     FROM categorias c
     LEFT JOIN producto_categorias pc ON pc.categoria_id = c.id
     LEFT JOIN productos p ON p.id = pc.producto_id AND p.visible = 1
     GROUP BY c.id
     ORDER BY c.orden, c.nombre`,
  );
  return filas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    descripcion: fila.descripcion,
    imagen: fila.imagen,
    totalProductos: Number(fila.total_productos),
  }));
}

async function obtenerCategoriaPorSlug(slug) {
  const [filas] = await pool.execute(
    'SELECT id, nombre, slug, descripcion, imagen FROM categorias WHERE slug = ?',
    [slug],
  );
  return filas[0] || null;
}

module.exports = { listarCategorias, obtenerCategoriaPorSlug };
