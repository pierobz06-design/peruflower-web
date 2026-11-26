const { pool } = require('../config/database');
const { formatearPrecio } = require('../utils/formato');

// Precio que paga el cliente: el de oferta si existe, si no el regular.
const PRECIO_FINAL = 'COALESCE(p.precio_oferta, p.precio)';

const COLUMNAS_TARJETA = `p.id, p.sku, p.nombre, p.slug, p.precio, p.precio_oferta, p.imagen,
  p.disponible, ${PRECIO_FINAL} AS precio_final`;

function rutaMiniatura(imagen) {
  return imagen.replace('/img/productos/', '/img/productos/miniaturas/');
}

/** Convierte una fila de la base en el objeto que usan las vistas. */
function aProducto(fila) {
  const tieneOferta = fila.precio_oferta !== null && fila.precio_oferta < fila.precio;
  return {
    id: fila.id,
    sku: fila.sku,
    nombre: fila.nombre,
    slug: fila.slug,
    precio: fila.precio,
    precioOferta: fila.precio_oferta,
    precioFinal: fila.precio_final,
    precioTexto: formatearPrecio(fila.precio_final),
    precioRegularTexto: formatearPrecio(fila.precio),
    tieneOferta,
    imagen: fila.imagen,
    miniatura: rutaMiniatura(fila.imagen),
    disponible: Boolean(fila.disponible),
  };
}

/**
 * Catálogo con filtros opcionales por ocasión (slug) y rango de presupuesto.
 * Solo devuelve productos visibles. Las consultas son parametrizadas.
 */
async function listarCatalogo({ ocasion, precioMin, precioMax } = {}) {
  const condiciones = ['p.visible = 1'];
  const parametros = [];

  if (ocasion) {
    condiciones.push(`EXISTS (
      SELECT 1 FROM producto_categorias pc
      JOIN categorias c ON c.id = pc.categoria_id
      WHERE pc.producto_id = p.id AND c.slug = ?)`);
    parametros.push(ocasion);
  }
  if (precioMin !== undefined) {
    condiciones.push(`${PRECIO_FINAL} >= ?`);
    parametros.push(precioMin);
  }
  if (precioMax !== undefined) {
    condiciones.push(`${PRECIO_FINAL} <= ?`);
    parametros.push(precioMax);
  }

  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_TARJETA}
     FROM productos p
     WHERE ${condiciones.join(' AND ')}
     ORDER BY p.disponible DESC, p.id`,
    parametros,
  );
  return filas.map(aProducto);
}

async function obtenerRangoPrecios() {
  const [[fila]] = await pool.query(
    `SELECT FLOOR(MIN(${PRECIO_FINAL})) AS minimo, CEIL(MAX(${PRECIO_FINAL})) AS maximo
     FROM productos p WHERE p.visible = 1`,
  );
  return { minimo: Number(fila.minimo) || 0, maximo: Number(fila.maximo) || 0 };
}

async function obtenerProductoPorSlug(slug) {
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_TARJETA}, p.descripcion, p.categoria_id,
            c.nombre AS categoria_nombre, c.slug AS categoria_slug
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.slug = ? AND p.visible = 1`,
    [slug],
  );
  if (filas.length === 0) {
    return null;
  }
  const fila = filas[0];
  const [ocasiones] = await pool.execute(
    `SELECT c.nombre, c.slug FROM producto_categorias pc
     JOIN categorias c ON c.id = pc.categoria_id
     WHERE pc.producto_id = ? ORDER BY c.orden`,
    [fila.id],
  );
  return {
    ...aProducto(fila),
    descripcion: fila.descripcion,
    categoria: { id: fila.categoria_id, nombre: fila.categoria_nombre, slug: fila.categoria_slug },
    ocasiones,
  };
}

/** Productos de una lista de IDs, respetando el orden indicado (para los destacados). */
async function listarPorIds(ids) {
  if (ids.length === 0) {
    return [];
  }
  const marcadores = ids.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_TARJETA} FROM productos p
     WHERE p.visible = 1 AND p.id IN (${marcadores})
     ORDER BY FIELD(p.id, ${marcadores})`,
    [...ids, ...ids],
  );
  return filas.map(aProducto);
}

/** Productos de una ocasión, opcionalmente excluyendo uno (para "productos relacionados"). */
async function listarPorOcasion(slugOcasion, { limite = 8, excluirId = 0 } = {}) {
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_TARJETA} FROM productos p
     JOIN producto_categorias pc ON pc.producto_id = p.id
     JOIN categorias c ON c.id = pc.categoria_id
     WHERE p.visible = 1 AND c.slug = ? AND p.id <> ?
     ORDER BY p.disponible DESC, p.id
     LIMIT ?`,
    [slugOcasion, excluirId, String(limite)],
  );
  return filas.map(aProducto);
}

/** Datos actuales (precio y disponibilidad) de los productos del carrito. Nunca se confía en el precio del navegador. */
async function listarParaCarrito(ids) {
  if (ids.length === 0) {
    return [];
  }
  const marcadores = ids.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT ${COLUMNAS_TARJETA} FROM productos p
     WHERE p.visible = 1 AND p.id IN (${marcadores})`,
    ids,
  );
  return filas.map(aProducto);
}

module.exports = {
  listarParaCarrito,
  listarCatalogo,
  obtenerRangoPrecios,
  obtenerProductoPorSlug,
  listarPorIds,
  listarPorOcasion,
};
