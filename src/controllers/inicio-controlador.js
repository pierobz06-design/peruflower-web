const { listarPorIds, listarPorOcasion } = require('../models/producto-modelo');
const { IDS_DESTACADOS } = require('../config/catalogo');
const { SLIDES, PASOS_COMPRA } = require('../config/contenido-inicio');

async function mostrarInicio(req, res) {
  const [destacados, boxes, condolencias] = await Promise.all([
    listarPorIds(IDS_DESTACADOS),
    listarPorOcasion('box', { limite: 8 }),
    listarPorOcasion('condolencias', { limite: 8 }),
  ]);

  res.render('pages/inicio', {
    titulo: 'Perú Flowers | Florería en Lima con delivery a Lima y Callao',
    descripcion:
      'Ramos, arreglos y box de flores frescas para cumpleaños, mamá y condolencias. Florería familiar en Salamanca, Ate, con delivery a todo Lima y Callao.',
    estilos: ['hero', 'marquesina', 'insignia-giratoria', 'tarjeta-ocasion', 'inicio'],
    slides: SLIDES,
    pasosCompra: PASOS_COMPRA,
    destacados,
    boxes,
    condolencias,
  });
}

module.exports = { mostrarInicio };
