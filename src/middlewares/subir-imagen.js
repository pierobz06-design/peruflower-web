const multer = require('multer');
const { crearErrorVisible } = require('../utils/errores');

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO_MB = 4;

/**
 * Recibe la foto del producto en memoria (no toca el disco hasta validarla con sharp).
 * Solo JPG, PNG o WebP de hasta 4 MB.
 */
const receptor = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_MB * 1024 * 1024, files: 1, fields: 30 },
  fileFilter(req, archivo, aceptar) {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      req.errorImagen = 'La foto debe ser JPG, PNG o WebP.';
      return aceptar(null, false);
    }
    aceptar(null, true);
  },
}).single('imagen');

function recibirImagenProducto(req, res, next) {
  receptor(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      req.errorImagen =
        error.code === 'LIMIT_FILE_SIZE'
          ? `La foto no debe pesar más de ${TAMANO_MAXIMO_MB} MB.`
          : 'No pudimos recibir la foto. Inténtalo otra vez.';
      return next();
    }
    if (error) {
      return next(crearErrorVisible('No pudimos procesar el formulario.', 400));
    }
    next();
  });
}

module.exports = { recibirImagenProducto, TAMANO_MAXIMO_MB };
