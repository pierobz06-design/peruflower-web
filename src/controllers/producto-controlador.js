const { obtenerProductoPorSlug, listarPorOcasion } = require('../models/producto-modelo');
const { separarLineas } = require('../utils/formato');
const { crearEnlaceWhatsapp, mensajeAsesoriaProducto } = require('../utils/whatsapp');

async function mostrarProducto(req, res, next) {
  const slug = String(req.params.slug || '');
  if (!/^[a-z0-9-]{1,140}$/.test(slug)) {
    return next();
  }
  const producto = await obtenerProductoPorSlug(slug);
  if (!producto) {
    return next();
  }

  const relacionados = await listarPorOcasion(producto.categoria.slug, {
    limite: 8,
    excluirId: producto.id,
  });
  const urlProducto = `${req.protocol}://${req.get('host')}/producto/${producto.slug}`;

  res.render('pages/producto', {
    titulo: `${producto.nombre} | Perú Flowers`,
    descripcion: `${producto.nombre}: ${separarLineas(producto.descripcion)[0]} Delivery a Lima y Callao.`,
    estilos: ['producto'],
    scripts: ['producto'],
    producto,
    caracteristicas: separarLineas(producto.descripcion),
    relacionados,
    // HU04: el botón de WhatsApp incluye el producto que se está viendo.
    enlaceWhatsapp: crearEnlaceWhatsapp(
      res.locals.negocio.whatsappNumero,
      mensajeAsesoriaProducto(producto, urlProducto),
    ),
  });
}

module.exports = { mostrarProducto };
