const { pool } = require('../config/database');

/**
 * Guarda el pedido y su detalle en una sola transacción: o se guarda todo o no se guarda nada.
 * El número visible (PF-000001) se genera a partir del id autoincremental.
 */
async function crearPedido(pedido, detalle) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.execute(
      `INSERT INTO pedidos
         (cliente_id, receptor_nombre, receptor_telefono, zona_entrega_id, direccion, referencia,
          fecha_entrega, horario_entrega, dedicatoria, subtotal, costo_envio, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
      [
        pedido.clienteId,
        pedido.receptorNombre,
        pedido.receptorTelefono,
        pedido.zonaEntregaId,
        pedido.direccion,
        pedido.referencia,
        pedido.fechaEntrega,
        pedido.horarioEntrega,
        pedido.dedicatoria,
        pedido.subtotal,
        pedido.costoEnvio,
        pedido.total,
      ],
    );
    const pedidoId = resultado.insertId;
    const codigo = `PF-${String(pedidoId).padStart(6, '0')}`;
    await conexion.execute('UPDATE pedidos SET codigo = ? WHERE id = ?', [codigo, pedidoId]);

    for (const linea of detalle) {
      await conexion.execute(
        `INSERT INTO detalle_pedido
           (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          linea.productoId,
          linea.nombre,
          linea.precioUnitario,
          linea.cantidad,
          linea.subtotal,
        ],
      );
    }
    await conexion.commit();
    return { id: pedidoId, codigo };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

/** Pedido completo de un cliente (solo el dueño puede verlo). */
async function obtenerPedidoDeCliente(codigo, clienteId) {
  const [filas] = await pool.execute(
    `SELECT p.id, p.codigo, p.cliente_id, p.receptor_nombre, p.receptor_telefono, p.direccion,
            p.referencia, p.fecha_entrega, p.horario_entrega, p.dedicatoria, p.subtotal,
            p.costo_envio, p.total, p.metodo_pago, p.codigo_operacion, p.tarjeta_ultimos4,
            p.estado, p.created_at, z.distrito, z.provincia,
            c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos,
            c.email AS cliente_email, c.telefono AS cliente_telefono
     FROM pedidos p
     JOIN zonas_entrega z ON z.id = p.zona_entrega_id
     JOIN clientes c ON c.id = p.cliente_id
     WHERE p.codigo = ? AND p.cliente_id = ?`,
    [codigo, clienteId],
  );
  if (filas.length === 0) {
    return null;
  }
  const [detalle] = await pool.execute(
    `SELECT d.producto_id, d.nombre_producto, d.precio_unitario, d.cantidad, d.subtotal,
            pr.slug, pr.imagen
     FROM detalle_pedido d
     JOIN productos pr ON pr.id = d.producto_id
     WHERE d.pedido_id = ? ORDER BY d.id`,
    [filas[0].id],
  );
  return { ...filas[0], detalle };
}

/**
 * Registra el método de pago elegido (HU11). Solo actúa si el pedido sigue "Pendiente",
 * así un pedido ya pagado no puede volver a cambiar.
 */
async function registrarPago(
  pedidoId,
  { metodo, codigoOperacion = null, ultimos4 = null, estado },
) {
  const [resultado] = await pool.execute(
    `UPDATE pedidos
     SET metodo_pago = ?, codigo_operacion = ?, tarjeta_ultimos4 = ?, estado = ?
     WHERE id = ? AND estado = 'Pendiente'`,
    [metodo, codigoOperacion, ultimos4, estado, pedidoId],
  );
  return resultado.affectedRows === 1;
}

module.exports = { crearPedido, obtenerPedidoDeCliente, registrarPago };
