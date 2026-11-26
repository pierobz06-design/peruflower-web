const path = require('node:path');
const dotenv = require('dotenv');

const raizProyecto = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(raizProyecto, '.env'), quiet: true });

function leerVariable(nombre, valorPorDefecto) {
  const valor = process.env[nombre];
  if (valor === undefined || valor === '') {
    if (valorPorDefecto !== undefined) {
      return valorPorDefecto;
    }
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo .env`);
  }
  return valor;
}

const esProduccion = leerVariable('NODE_ENV', 'development') === 'production';

const config = {
  raizProyecto,
  esProduccion,
  puerto: Number(leerVariable('PORT', '3000')),
  sessionSecret: leerVariable('SESSION_SECRET'),
  db: {
    host: leerVariable('DB_HOST', 'localhost'),
    port: Number(leerVariable('DB_PORT', '3306')),
    user: leerVariable('DB_USER', 'root'),
    password: leerVariable('DB_PASSWORD', ''),
    database: leerVariable('DB_NAME', 'peruflower'),
  },
  admin: {
    nombre: leerVariable('ADMIN_NOMBRE', 'Administrador Perú Flowers'),
    email: leerVariable('ADMIN_EMAIL', 'admin@peruflower.com'),
    password: leerVariable('ADMIN_PASSWORD', ''),
  },
  negocio: {
    whatsappNumero: leerVariable('WHATSAPP_NUMERO'),
    yapePlinNumero: leerVariable('YAPE_PLIN_NUMERO', ''),
    yapePlinTitular: leerVariable('YAPE_PLIN_TITULAR', 'Perú Flowers'),
    // Ruta pública opcional de la imagen del QR, por ejemplo /img/pagos/qr-yape.png
    yapePlinQr: leerVariable('YAPE_PLIN_QR', ''),
  },
};

if (config.sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
}

module.exports = config;
