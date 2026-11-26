-- Tablas de la base
USE peruflower;
SHOW TABLES;

-- Relaciones entre tablas
USE peruflower;
SELECT TABLE_NAME AS tabla,
       COLUMN_NAME AS columna,
       REFERENCED_TABLE_NAME AS se_conecta_con
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'peruflower'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Resumen de registros
USE peruflower;
SELECT
  (SELECT COUNT(*) FROM productos) AS productos,
  (SELECT COUNT(*) FROM categorias) AS ocasiones,
  (SELECT COUNT(*) FROM zonas_entrega) AS distritos,
  (SELECT COUNT(*) FROM clientes) AS clientes,
  (SELECT COUNT(*) FROM pedidos) AS pedidos;

-- Productos por ocasion y precio
USE peruflower;
SELECT p.nombre, p.precio
FROM productos p
JOIN producto_categorias pc ON pc.producto_id = p.id
JOIN categorias c ON c.id = pc.categoria_id
WHERE c.slug = 'cumpleanos' AND p.visible = 1
  AND p.precio BETWEEN 80 AND 150
ORDER BY p.precio;

-- Pedidos con cliente y distrito
USE peruflower;
SELECT p.codigo, c.email, z.distrito,
       p.fecha_entrega, p.subtotal, p.costo_envio,
       p.total, p.metodo_pago, p.estado
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN zonas_entrega z ON z.id = p.zona_entrega_id;

-- Pedidos pendientes de entrega
USE peruflower;
SELECT p.fecha_entrega, p.horario_entrega,
       d.nombre_producto, d.cantidad, p.dedicatoria
FROM detalle_pedido d
JOIN pedidos p ON p.id = d.pedido_id
WHERE p.estado <> 'Entregado'
ORDER BY p.fecha_entrega;

-- Ventas por metodo de pago
USE peruflower;
SELECT metodo_pago,
       COUNT(*) AS pedidos,
       SUM(total) AS monto
FROM pedidos
GROUP BY metodo_pago;

-- Contraseñas y tarjetas
USE peruflower;
SELECT c.email, c.password_hash,
       p.codigo, p.metodo_pago, p.tarjeta_ultimos4
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id;

-- Consentimiento de clientes
USE peruflower;
SELECT email,
       acepta_privacidad, fecha_acepta_privacidad,
       acepta_promociones, fecha_acepta_promociones
FROM clientes;

-- Prueba de llave foranea
USE peruflower;
DELETE FROM categorias
WHERE slug = 'cumpleanos';

-- Prueba de restriccion CHECK
USE peruflower;
UPDATE productos SET precio = -10
WHERE id = 1;

-- Estado de pedidos
USE peruflower;
SELECT codigo, estado,
       DATE_FORMAT(updated_at, '%d/%m/%Y %H:%i:%s') AS actualizado
FROM pedidos;
