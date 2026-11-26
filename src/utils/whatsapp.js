/**
 * Crea un enlace wa.me con un mensaje ya escrito.
 * encodeURIComponent conserva los saltos de línea (%0A) para que el mensaje llegue ordenado.
 */
function crearEnlaceWhatsapp(numero, mensaje) {
  const soloDigitos = String(numero).replace(/\D/g, '');
  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
}

function mensajeAsesoriaGeneral() {
  return '¡Hola, Perú Flowers! 🌸 Quisiera asesoría para elegir un arreglo floral.';
}

function mensajeAsesoriaProducto(producto, urlProducto) {
  return [
    '¡Hola, Perú Flowers! 🌸',
    'Quisiera asesoría sobre este arreglo:',
    `• ${producto.nombre} (${producto.sku})`,
    `• Precio: ${producto.precioTexto}`,
    `• Enlace: ${urlProducto}`,
  ].join('\n');
}

/**
 * Mensaje completo del pedido para la recepcionista (HU11, opción "Continuar por WhatsApp").
 * Recibe el pedido ya formateado (montos y fecha en texto).
 */
function mensajePedido(pedido) {
  const lineas = [
    '🌸 *Nuevo pedido desde Peruflower.com*',
    `*Pedido:* ${pedido.codigo}`,
    '',
    '*Productos:*',
    ...pedido.detalle.map(
      (linea) =>
        `• ${linea.cantidad} x ${linea.nombre_producto} (${linea.precioTexto} c/u) = ${linea.subtotalTexto}`,
    ),
    '',
    `*Subtotal:* ${pedido.subtotalTexto}`,
    `*Envío (${pedido.distrito}):* ${pedido.costoEnvioTexto}`,
    `*Total a pagar:* ${pedido.totalTexto}`,
    '',
    '*Datos de entrega:*',
    `Recibe: ${pedido.receptor_nombre}`,
    `Celular de quien recibe: ${pedido.receptor_telefono}`,
    `Distrito: ${pedido.distrito} (${pedido.provincia})`,
    `Dirección: ${pedido.direccion}`,
    `Referencia: ${pedido.referencia || 'Sin referencia'}`,
    `Fecha: ${pedido.fechaEntregaTexto}`,
    `Horario: ${pedido.horario_entrega}`,
    `Dedicatoria: ${pedido.dedicatoria ? `"${pedido.dedicatoria}"` : 'Sin dedicatoria'}`,
    '',
    '*Datos del cliente:*',
    `Nombre: ${pedido.cliente_nombres} ${pedido.cliente_apellidos}`,
    `Correo: ${pedido.cliente_email}`,
    `Celular: ${pedido.cliente_telefono}`,
    '',
    'Quisiera coordinar el pago de mi pedido. ¡Gracias!',
  ];
  return lineas.join('\n');
}

module.exports = {
  crearEnlaceWhatsapp,
  mensajeAsesoriaGeneral,
  mensajeAsesoriaProducto,
  mensajePedido,
};
