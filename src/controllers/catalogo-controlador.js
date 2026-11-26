const { listarCatalogo, obtenerRangoPrecios } = require('../models/producto-modelo');
const { obtenerCategoriaPorSlug } = require('../models/categoria-modelo');
const { formatearPrecio } = require('../utils/formato');

function describirPresupuesto({ precioMin, precioMax }) {
  if (precioMin !== undefined && precioMax !== undefined) {
    return `${formatearPrecio(precioMin)} a ${formatearPrecio(precioMax)}`;
  }
  if (precioMax !== undefined) {
    return `Hasta ${formatearPrecio(precioMax)}`;
  }
  if (precioMin !== undefined) {
    return `Desde ${formatearPrecio(precioMin)}`;
  }
  return null;
}

async function mostrarCatalogo(req, res, next) {
  const filtros = req.filtros;
  let categoria = null;
  if (filtros.ocasion) {
    categoria = await obtenerCategoriaPorSlug(filtros.ocasion);
    if (!categoria) {
      return next();
    }
  }

  const [productos, rango] = await Promise.all([listarCatalogo(filtros), obtenerRangoPrecios()]);
  const titulo = categoria ? categoria.nombre : 'Catálogo de arreglos florales';

  res.render('pages/catalogo', {
    titulo: `${titulo} | Perú Flowers`,
    descripcion: categoria
      ? `${categoria.descripcion} Delivery a todo Lima y Callao.`
      : 'Encuentra ramos, arreglos, box y coronas por ocasión y presupuesto. Delivery a Lima y Callao.',
    estilos: ['catalogo'],
    scripts: ['catalogo'],
    categoria,
    productos,
    filtros,
    rango,
    presupuestoTexto: describirPresupuesto(filtros),
  });
}

module.exports = { mostrarCatalogo };
