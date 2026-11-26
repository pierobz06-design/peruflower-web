/**
 * Consultas del panel de administración para pedidos (HU10):
 * lista con filtros por estado y fecha, detalle completo y cambio de estado.
 */
const { pool } = require('../config/database');

const POR_PAGINA = 15;

function construirFiltros({ estado, tipoFecha, desde, hasta, buscar }) {
  const condiciones = [];
  const parametros = [];
  if (estado) {
    condiciones.push('p.estado = ?');
    parametros.push(estado);
  }
  // Las fechas se comparan como texto AAAA-MM-DD sobre la columna elegida (pedido o entrega).
  const columnaFecha = tipoFecha === 'entrega' ? 'p.fecha_entrega' : 'DATE(p.created_at)';
  if (desde) {
    condiciones.push(`${columnaFecha} >= ?`);
    parametros.push(desde);
  }
  if (hasta) {
    condiciones.push(`${columnaFecha} <= ?`);
    parametros.push(hasta);
  }
  if (buscar) {
    condiciones.push(
      "(p.codigo LIKE ? OR p.receptor_nombre LIKE ? OR CONCAT(c.nombres, ' ', c.apellidos) LIKE ? OR c.email LIKE ?)",
    );
    parametros.push(...Array(4).fill(`%${buscar}%`));
  }
  return {
    donde: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '',
    parametros,
  };
}

async function listarPedidosAdmin(filtros, pagina = 1) {
  const { donde, parametros } = construirFiltros(filtros);
  const desdeFila = (pagina - 1) * POR_PAGINA;
  const [filas] = await pool.execute(
    `SELECT p.codigo, p.created_at, p.receptor_nombre, p.fecha_entrega, p.horario_entrega,
            p.total, p.metodo_pago, p.estado, z.distrito,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente
     FROM pedidos p
     JOIN clientes c ON c.id = p.cliente_id
     JOIN zonas_entrega z ON z.id = p.zona_entrega_id
     ${donde}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [...parametros, String(POR_PAGINA), String(desdeFila)],
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM pedidos p JOIN clientes c ON c.id = p.cliente_id ${donde}`,
    parametros,
  );
  return { pedidos: filas, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

async function contarPedidosPorEstado() {
  const [filas] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS monto
     FROM pedidos GROUP BY estado`,
  );
  const conteo = { Pendiente: 0, Pagado: 0, Entregado: 0, montoCobrado: 0 };
  for (const fila of filas) {
    conteo[fila.estado] = Number(fila.cantidad);
    if (fila.estado !== 'Pendiente') {
      conteo.montoCobrado += Number(fila.monto);
    }
  }
  return conteo;
}

async function obtenerPedidoAdmin(codigo) {
  const [filas] = await pool.execute(
    `SELECT p.*, z.distrito, z.provincia,
            c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos,
            c.email AS cliente_email, c.telefono AS cliente_telefono
     FROM pedidos p
     JOIN zonas_entrega z ON z.id = p.zona_entrega_id
     JOIN clientes c ON c.id = p.cliente_id
     WHERE p.codigo = ?`,
    [codigo],
  );
  if (filas.length === 0) {
    return null;
  }
  const [detalle] = await pool.execute(
    `SELECT d.producto_id, d.nombre_producto, d.precio_unitario, d.cantidad, d.subtotal,
            pr.slug, pr.imagen, pr.sku
     FROM detalle_pedido d JOIN productos pr ON pr.id = d.producto_id
     WHERE d.pedido_id = ? ORDER BY d.id`,
    [filas[0].id],
  );
  return { ...filas[0], detalle };
}

async function cambiarEstadoPedido(codigo, estado) {
  const [resultado] = await pool.execute('UPDATE pedidos SET estado = ? WHERE codigo = ?', [
    estado,
    codigo,
  ]);
  return resultado.affectedRows === 1;
}

module.exports = {
  listarPedidosAdmin,
  contarPedidosPorEstado,
  obtenerPedidoAdmin,
  cambiarEstadoPedido,
  POR_PAGINA,
};
