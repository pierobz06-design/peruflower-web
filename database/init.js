/**
 * npm run db:init
 * 1. Crea la base de datos y las tablas (database/schema.sql).
 * 2. Revisa que las fotos de los productos estén en public/img/productos/ y crea las miniaturas que falten.
 * 3. Carga los datos iniciales (ocasiones, zonas, 37 productos y administrador de prueba).
 * Se puede ejecutar varias veces sin duplicar datos.
 */
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const sharp = require('sharp');
const config = require('../src/config/env');
const { cargarDatosIniciales, productos } = require('./seed');

const carpetaProductos = path.join(config.raizProyecto, 'public', 'img', 'productos');
const carpetaMiniaturas = path.join(carpetaProductos, 'miniaturas');
const ANCHO_MINIATURA = 600;

function validarNombreBase(nombre) {
  if (!/^[A-Za-z0-9_]+$/.test(nombre)) {
    throw new Error('DB_NAME solo puede tener letras, números y guion bajo.');
  }
}

async function crearEsquema() {
  validarNombreBase(config.db.database);
  const sql = fs
    .readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .replace(
      /CREATE DATABASE IF NOT EXISTS peruflower/,
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``,
    )
    .replace(/USE peruflower;/, `USE \`${config.db.database}\`;`);

  // Conexión exclusiva para el script: permite ejecutar todo el archivo .sql de una vez.
  const conexion = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    charset: 'utf8mb4',
    multipleStatements: true,
  });
  try {
    await conexion.query(sql);
  } finally {
    await conexion.end();
  }
}

async function prepararImagenes() {
  fs.mkdirSync(carpetaMiniaturas, { recursive: true });
  let miniaturas = 0;
  const faltantes = [];

  for (const producto of productos) {
    const nombreArchivo = path.basename(producto.imagen);
    const destino = path.join(carpetaProductos, nombreArchivo);

    if (!fs.existsSync(destino)) {
      faltantes.push(nombreArchivo);
      continue;
    }

    const miniatura = path.join(carpetaMiniaturas, nombreArchivo);
    if (!fs.existsSync(miniatura)) {
      await sharp(destino)
        .resize({ width: ANCHO_MINIATURA, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(miniatura);
      miniaturas += 1;
    }
  }
  return { miniaturas, faltantes };
}

async function mostrarResumen() {
  const conexion = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
  try {
    const tablas = [
      'categorias',
      'productos',
      'producto_categorias',
      'clientes',
      'zonas_entrega',
      'pedidos',
      'detalle_pedido',
      'administradores',
      'sessions',
    ];
    console.log('\nRegistros por tabla:');
    for (const tabla of tablas) {
      const [[fila]] = await conexion.query(`SELECT COUNT(*) AS total FROM \`${tabla}\``);
      console.log(`  ${tabla.padEnd(20)} ${fila.total}`);
    }
  } finally {
    await conexion.end();
  }
}

async function iniciar() {
  console.log(`Creando la base "${config.db.database}" y sus tablas...`);
  await crearEsquema();

  console.log('Preparando imágenes de productos...');
  const imagenes = await prepararImagenes();
  console.log(`  ${imagenes.miniaturas} miniaturas nuevas`);
  if (imagenes.faltantes.length > 0) {
    console.warn(`  No se encontraron: ${imagenes.faltantes.join(', ')}`);
  }

  console.log('Cargando datos iniciales...');
  const conexion = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
  try {
    const resultado = await cargarDatosIniciales(conexion, config.admin);
    console.log(`  ${resultado.productosNuevos} productos nuevos`);
    console.log(
      resultado.adminCreado
        ? `  Administrador creado: ${config.admin.email}`
        : `  El administrador ${config.admin.email} ya existía`,
    );
  } finally {
    await conexion.end();
  }

  await mostrarResumen();
  console.log('\nBase de datos lista.');
}

iniciar().catch((error) => {
  const mensaje =
    error.code === 'ER_ACCESS_DENIED_ERROR'
      ? 'Usuario o contraseña de MySQL incorrectos. Revisa DB_USER y DB_PASSWORD en .env'
      : error.code === 'ECONNREFUSED'
        ? 'No se pudo conectar a MySQL. Verifica que el servicio MySQL84 esté iniciado.'
        : error.message;
  console.error(`Error: ${mensaje}`);
  process.exitCode = 1;
});
