const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const config = require('../config/env');
const { pool } = require('../config/database');

const MySQLStore = MySQLStoreFactory(session);
const DURACION_SESION_MS = 3 * 24 * 60 * 60 * 1000;

// Las sesiones se guardan en la tabla "sessions" de MySQL (creada por schema.sql).
const almacen = new MySQLStore(
  {
    createDatabaseTable: false,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: DURACION_SESION_MS,
    schema: { tableName: 'sessions' },
  },
  pool,
);

const sesion = session({
  name: 'pf.sid',
  secret: config.sessionSecret,
  store: almacen,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.esProduccion,
    maxAge: DURACION_SESION_MS,
  },
});

/** Cambia el identificador de sesión conservando el carrito (evita la fijación de sesión). */
function regenerarSesion(req) {
  const carrito = req.session.carrito;
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        return reject(error);
      }
      if (carrito) {
        req.session.carrito = carrito;
      }
      resolve();
    });
  });
}

function guardarSesion(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

module.exports = { sesion, almacen, regenerarSesion, guardarSesion };
