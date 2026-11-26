const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config/env');
const { cargarDatosGlobales } = require('./middlewares/datos-globales');
const { rutaNoEncontrada, manejarErrores } = require('./middlewares/manejo-errores');
const { sesion } = require('./middlewares/sesion');
const { proteccionCsrf } = require('./middlewares/csrf');
const tiendaRutas = require('./routes/tienda-rutas');
const cuentaRutas = require('./routes/cuenta-rutas');
const carritoRutas = require('./routes/carrito-rutas');
const pedidoRutas = require('./routes/pedido-rutas');
const { subidasAdmin, adminRutas } = require('./routes/admin-rutas');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

// Cabeceras de seguridad. La política CSP solo permite recursos del propio sitio
// (por eso no hay estilos ni scripts dentro del HTML).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        // blob: permite la vista previa de la foto antes de subirla en el panel.
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        // En desarrollo se prueba por http desde el celular, así que no se fuerza https.
        upgradeInsecureRequests: config.esProduccion ? [] : null,
      },
    },
    strictTransportSecurity: config.esProduccion,
  }),
);

// Comprime HTML, CSS y JS (gzip) para que la página cargue más rápido.
app.use(compression());
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));

const cacheEstaticos = { maxAge: config.esProduccion ? '7d' : 0 };
app.use(express.static(path.join(config.raizProyecto, 'public'), cacheEstaticos));
// Fuentes Aboreto y Quicksand instaladas con npm (@fontsource), servidas desde el propio sitio.
app.use(
  '/fuentes',
  express.static(path.join(config.raizProyecto, 'node_modules', '@fontsource'), {
    maxAge: '30d',
    immutable: true,
  }),
);

// La sesión va después de los archivos estáticos para no crear sesiones por cada imagen o estilo.
app.use(sesion);
// Formularios del panel con foto: se leen antes de verificar el token CSRF que traen dentro.
app.use(subidasAdmin);
app.use(proteccionCsrf);
app.use(cargarDatosGlobales);
app.use(tiendaRutas);
app.use(cuentaRutas);
app.use(carritoRutas);
app.use(pedidoRutas);
app.use(adminRutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

module.exports = app;
