/**
 * Alta y edición de productos desde el panel (HU05).
 * Valida que el SKU no se repita, genera la URL (slug) y guarda la foto subida.
 */
const {
  existeSku,
  existeSlug,
  crearProducto,
  actualizarProducto,
} = require('../models/producto-admin-modelo');
const { listarCategorias } = require('../models/categoria-modelo');
const { guardarImagenProducto, borrarImagenSubida } = require('./imagen-servicio');
const { limpiarCacheCategorias } = require('../middlewares/datos-globales');
const { crearSlug } = require('../utils/texto');
const { crearErrorVisible } = require('../utils/errores');

async function slugDisponible(nombre) {
  const base = crearSlug(nombre).slice(0, 120) || 'arreglo';
  let slug = base;
  let numero = 2;
  while (await existeSlug(slug)) {
    slug = `${base}-${numero}`;
    numero += 1;
  }
  return slug;
}

function datosProducto(formulario) {
  return {
    sku: formulario.sku,
    nombre: formulario.nombre,
    descripcion: formulario.descripcion,
    precio: formulario.precio,
    precioOferta: formulario.precioOferta || null,
    categoriaId: formulario.categoriaId,
    ocasiones: formulario.ocasiones,
    disponible: formulario.disponible,
    visible: formulario.visible,
  };
}

async function validarSku(sku, excluirId) {
  if (await existeSku(sku, excluirId)) {
    throw Object.assign(crearErrorVisible('Ya existe otro producto con ese código (SKU).'), {
      campo: 'sku',
    });
  }
}

/** La categoría principal debe existir; las ocasiones que no existan se descartan. */
async function validarCategorias(formulario) {
  const existentes = new Set((await listarCategorias()).map((categoria) => categoria.id));
  if (!existentes.has(formulario.categoriaId)) {
    throw Object.assign(crearErrorVisible('Elige una categoría principal válida.'), {
      campo: 'categoriaId',
    });
  }
  formulario.ocasiones = formulario.ocasiones.filter((id) => existentes.has(id));
}

async function registrarProducto(formulario, archivo) {
  await validarCategorias(formulario);
  if (!archivo) {
    throw Object.assign(crearErrorVisible('Sube una foto del arreglo.'), { campo: 'imagen' });
  }
  await validarSku(formulario.sku, 0);
  const slug = await slugDisponible(formulario.nombre);
  const imagen = await guardarImagenProducto(archivo.buffer, slug);
  try {
    const id = await crearProducto({ ...datosProducto(formulario), slug, imagen });
    limpiarCacheCategorias();
    return id;
  } catch (error) {
    await borrarImagenSubida(imagen);
    throw error;
  }
}

async function editarProducto(producto, formulario, archivo) {
  await validarCategorias(formulario);
  await validarSku(formulario.sku, producto.id);
  const imagen = archivo
    ? await guardarImagenProducto(archivo.buffer, producto.slug)
    : producto.imagen;
  await actualizarProducto(producto.id, { ...datosProducto(formulario), imagen });
  if (archivo) {
    await borrarImagenSubida(producto.imagen);
  }
  limpiarCacheCategorias();
}

module.exports = { registrarProducto, editarProducto };
