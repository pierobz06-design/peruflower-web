const config = require('./env');

// Datos públicos de Perú Flowers que se muestran en la página (tomados de peruflowers.com.pe).
const negocio = {
  nombre: 'Perú Flowers',
  sitio: 'Peruflower.com',
  direccion: 'Calle José Olaya 153, Salamanca de Monterrico, Ate, Lima',
  coberturaEntrega: 'Delivery los 7 días de la semana a todo Lima y Callao',
  whatsappNumero: config.negocio.whatsappNumero,
  yapePlin: {
    numero: config.negocio.yapePlinNumero,
    titular: config.negocio.yapePlinTitular,
    qr: config.negocio.yapePlinQr,
  },
  redes: [
    {
      nombre: 'Instagram',
      icono: 'instagram',
      url: 'https://www.instagram.com/peruflowersoficial',
    },
    {
      nombre: 'Facebook',
      icono: 'facebook',
      url: 'https://www.facebook.com/p/Peruflowers-100077289798099/',
    },
    { nombre: 'TikTok', icono: 'tiktok', url: 'https://www.tiktok.com/@peruflowers' },
  ],
};

module.exports = negocio;
