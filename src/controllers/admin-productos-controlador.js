const {
  listarProductosAdmin,
  obtenerProductoAdmin,
  cambiarVisibilidad,
} = require('../models/producto-admin-modelo');
const { listarCategorias } = require('../models/categoria-modelo');
const { registrarProducto, editarProducto } = require('../services/producto-admin-servicio');
const { limpiarCacheCategorias } = require('../middlewares/datos-globales');
const { obtenerErrores } = require('../middlewares/validacion');
const { TAMANO_MAXIMO_MB } = require('../middlewares/subir-imagen');
const { rutaSegura } = require('../utils/redireccion');

async function listar(req, res) {
  const visibilidad = ['visibles', 'ocultos'].includes(req.query.ver) ? req.query.ver : '';
  const buscar = String(req.query.buscar || '')
    .trim()
    .slice(0, 60);
  res.render('admin/productos', {
    titulo: 'Productos | Panel Perú Flowers',
    seccion: 'productos',
    productos: await listarProductosAdmin({ visibilidad, buscar }),
    visibilidad,
    buscar,
    // Para volver a la misma lista (con sus filtros) después de ocultar o mostrar un producto.
    rutaVolver: req.originalUrl,
  });
}

async function renderizarFormulario(res, { producto = null, valores, errores = {}, estado = 200 }) {
  res.status(estado).render('admin/producto-formulario', {
    titulo: `${producto ? 'Editar' : 'Nuevo'} producto | Panel Perú Flowers`,
    seccion: 'productos',
    producto,
    valores,
    errores,
    categorias: await listarCategorias(),
    tamanoMaximoMb: TAMANO_MAXIMO_MB,
  });
}

/** Valores del formulario a partir de un producto guardado (para editar). */
function valoresDeProducto(producto) {
  return {
    nombre: producto.nombre,
    sku: producto.sku,
    descripcion: producto.descripcion,
    precio: producto.precio,
    precioOferta: producto.precio_oferta || '',
    categoriaId: producto.categoria_id,
    ocasiones: producto.ocasiones,
    disponible: Boolean(producto.disponible),
    visible: Boolean(producto.visible),
  };
}

function mostrarNuevo(req, res) {
  return renderizarFormulario(res, {
    valores: { disponible: true, visible: true, ocasiones: [] },
  });
}

/** Junta los errores de validación, de la foto y del servicio (SKU repetido, imagen inválida). */
function erroresDeFormulario(req) {
  const errores = obtenerErrores(req) || {};
  if (req.errorImagen) {
    errores.imagen = req.errorImagen;
  }
  return Object.keys(errores).length > 0 ? errores : null;
}

async function guardar(req, res, producto) {
  const errores = erroresDeFormulario(req);
  if (errores) {
    return renderizarFormulario(res, { producto, valores: req.body, errores, estado: 422 });
  }
  try {
    if (producto) {
      await editarProducto(producto, req.body, req.file);
    } else {
      await registrarProducto(req.body, req.file);
    }
  } catch (error) {
    if (!error.expose) {
      throw error;
    }
    return renderizarFormulario(res, {
      producto,
      valores: req.body,
      errores: { [error.campo || 'imagen']: error.message },
      estado: 422,
    });
  }
  req.session.aviso = {
    tipo: 'exito',
    texto: `Producto "${req.body.nombre}" ${producto ? 'actualizado' : 'agregado'}.`,
  };
  res.redirect('/admin/productos');
}

function crear(req, res) {
  return guardar(req, res, null);
}

async function cargarProducto(req, res, next) {
  const id = Number(req.params.id);
  const producto = Number.isInteger(id) && id > 0 ? await obtenerProductoAdmin(id) : null;
  if (!producto) {
    return next('route');
  }
  req.producto = producto;
  next();
}

function mostrarEditar(req, res) {
  return renderizarFormulario(res, {
    producto: req.producto,
    valores: valoresDeProducto(req.producto),
  });
}

function actualizar(req, res) {
  return guardar(req, res, req.producto);
}

/** HU05: ocultar o volver a mostrar un producto en la tienda. */
async function alternarVisibilidad(req, res) {
  const visible = !req.producto.visible;
  await cambiarVisibilidad(req.producto.id, visible);
  limpiarCacheCategorias();
  req.session.aviso = {
    tipo: 'exito',
    texto: `"${req.producto.nombre}" ahora está ${visible ? 'visible' : 'oculto'} en la tienda.`,
  };
  // Vuelve a la lista con los mismos filtros (solo rutas internas del panel).
  const volver = rutaSegura(req.body.volver, '/admin/productos');
  res.redirect(volver.startsWith('/admin/productos') ? volver : '/admin/productos');
}

module.exports = {
  listar,
  mostrarNuevo,
  crear,
  cargarProducto,
  mostrarEditar,
  actualizar,
  alternarVisibilidad,
};
