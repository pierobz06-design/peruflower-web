/**
 * Guarda la foto subida desde el panel en public/img/productos/ (HU05):
 * la convierte a WebP, la limita a 1080 px y crea su miniatura de 600 px.
 * sharp valida que el archivo sea realmente una imagen (no basta con la extensión).
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const config = require('../config/env');
const { crearErrorVisible } = require('../utils/errores');

const carpetaProductos = path.join(config.raizProyecto, 'public', 'img', 'productos');
const carpetaMiniaturas = path.join(carpetaProductos, 'miniaturas');
// Las fotos subidas desde el panel llevan la fecha en el nombre: ramo-de-rosas-1763600000000.webp
const PATRON_SUBIDA = /^[a-z0-9-]+-\d{13}\.webp$/;

async function guardarImagenProducto(buffer, slug) {
  try {
    const datos = await sharp(buffer).metadata();
    if (!datos.width || !datos.height || datos.width < 300 || datos.height < 300) {
      throw crearErrorVisible('La foto debe medir al menos 300 × 300 píxeles.');
    }
  } catch (error) {
    if (error.expose) {
      throw error;
    }
    throw crearErrorVisible('El archivo no es una imagen válida.');
  }

  const nombreArchivo = `${slug}-${Date.now()}.webp`;
  await fs.mkdir(carpetaMiniaturas, { recursive: true });
  const imagen = sharp(buffer).rotate();
  await imagen
    .clone()
    .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(carpetaProductos, nombreArchivo));
  await imagen
    .clone()
    .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(carpetaMiniaturas, nombreArchivo));
  return `/img/productos/${nombreArchivo}`;
}

/** Borra una foto anterior solo si fue subida desde el panel (nunca las fotos originales del catálogo). */
async function borrarImagenSubida(rutaPublica) {
  const nombreArchivo = path.basename(String(rutaPublica || ''));
  if (!PATRON_SUBIDA.test(nombreArchivo)) {
    return;
  }
  await Promise.allSettled([
    fs.unlink(path.join(carpetaProductos, nombreArchivo)),
    fs.unlink(path.join(carpetaMiniaturas, nombreArchivo)),
  ]);
}

module.exports = { guardarImagenProducto, borrarImagenSubida };
