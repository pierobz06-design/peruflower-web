const app = require('./app');
const config = require('./config/env');
const { verificarConexion } = require('./config/database');

async function iniciarServidor() {
  try {
    await verificarConexion();
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error.code || error.message);
    console.error('  Revisa el servicio MySQL84 y los datos DB_* del archivo .env');
    process.exit(1);
  }

  const servidor = app.listen(config.puerto, () => {
    console.log(`Peruflower.com disponible en http://localhost:${config.puerto}`);
  });

  servidor.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `El puerto ${config.puerto} ya está en uso: la página ya está abierta en otra terminal.`,
      );
      console.error('  Cierra esa terminal (Ctrl + C) o cambia PORT en el archivo .env.');
    } else {
      console.error('No se pudo iniciar el servidor:', error.message);
    }
    process.exit(1);
  });
}

iniciarServidor();
