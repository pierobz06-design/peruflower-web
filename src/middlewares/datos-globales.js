const negocio = require('../config/negocio');
const { listarCategorias } = require('../models/categoria-modelo');
const { formatearPrecio } = require('../utils/formato');
const { crearEnlaceWhatsapp, mensajeAsesoriaGeneral } = require('../utils/whatsapp');
const { RANGOS_PRESUPUESTO, crearEnlaceCatalogo } = require('../config/catalogo');
const { contarUnidades } = require('../services/carrito-servicio');

const DURACION_CACHE_MS = 60 * 1000;
let cacheCategorias = { datos: null, vence: 0 };

// Las ocasiones casi nunca cambian: se guardan un minuto en memoria para no consultar en cada página.
async function obtenerCategoriasMenu() {
  if (cacheCategorias.datos && Date.now() < cacheCategorias.vence) {
    return cacheCategorias.datos;
  }
  const datos = await listarCategorias();
  cacheCategorias = { datos, vence: Date.now() + DURACION_CACHE_MS };
  return datos;
}

/** Datos que necesitan todas las vistas (header, footer, botón de WhatsApp). */
async function cargarDatosGlobales(req, res, next) {
  res.locals.negocio = negocio;
  res.locals.rutaActual = req.path;
  res.locals.anioActual = new Date().getFullYear();
  res.locals.formatearPrecio = formatearPrecio;
  res.locals.rangosPresupuesto = RANGOS_PRESUPUESTO;
  res.locals.crearEnlaceCatalogo = crearEnlaceCatalogo;
  res.locals.enlaceWhatsapp = crearEnlaceWhatsapp(negocio.whatsappNumero, mensajeAsesoriaGeneral());
  res.locals.categoriasMenu = await obtenerCategoriasMenu();
  res.locals.clienteActual = req.session.clienteId
    ? { id: req.session.clienteId, nombre: req.session.clienteNombre }
    : null;
  res.locals.carritoCantidad = contarUnidades(req.session);
  res.locals.adminActual = req.session.adminId
    ? { id: req.session.adminId, nombre: req.session.adminNombre }
    : null;
  // Aviso de una sola vez (por ejemplo "Tu cuenta fue creada"): se muestra y se borra.
  res.locals.aviso = req.session.aviso || null;
  delete req.session.aviso;
  next();
}

/** Se llama cuando el panel cambia productos, para que los conteos del menú se actualicen. */
function limpiarCacheCategorias() {
  cacheCategorias = { datos: null, vence: 0 };
}

module.exports = { cargarDatosGlobales, limpiarCacheCategorias };
