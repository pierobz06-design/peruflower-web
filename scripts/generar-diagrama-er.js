/**
 * Genera el diagrama entidad-relación de la base "peruflower" leyendo su estructura real
 * desde MySQL (information_schema): tablas, columnas, llaves primarias y foráneas.
 * Resultado: docs/diagrama-entidad-relacion.svg y .png
 * Uso: npm run db:diagrama
 */
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const sharp = require('sharp');
const config = require('../src/config/env');

// Posición de cada tabla en el dibujo (columnas de izquierda a derecha).
const POSICIONES = {
  categorias: [40, 90],
  producto_categorias: [40, 470],
  productos: [470, 90],
  detalle_pedido: [470, 520],
  pedidos: [900, 90],
  clientes: [1330, 90],
  zonas_entrega: [1330, 470],
  administradores: [1760, 90],
  sessions: [1760, 420],
};
const ANCHO_TABLA = 330;
const ALTO_CABECERA = 38;
const ALTO_FILA = 24;
const COLORES = {
  cabecera: '#d62828',
  cabeceraTecnica: '#5d6470',
  borde: '#e3d3d5',
  texto: '#111821',
  suave: '#6b7280',
  pk: '#b7791f',
  fk: '#2563eb',
  linea: '#9a2c2c',
};

const escapar = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function leerEstructura() {
  const conexion = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
  try {
    const [columnas] = await conexion.execute(
      `SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna, COLUMN_TYPE AS tipo,
              COLUMN_KEY AS clave, IS_NULLABLE AS nulo
       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [config.db.database],
    );
    const [foraneas] = await conexion.execute(
      `SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna,
              REFERENCED_TABLE_NAME AS tablaDestino, REFERENCED_COLUMN_NAME AS columnaDestino
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [config.db.database],
    );
    const tablas = {};
    for (const fila of columnas) {
      (tablas[fila.tabla] ||= []).push(fila);
    }
    return { tablas, foraneas };
  } finally {
    await conexion.end();
  }
}

function dibujarTabla(nombre, columnas, foraneas) {
  const [x, y] = POSICIONES[nombre];
  const alto = ALTO_CABECERA + columnas.length * ALTO_FILA + 8;
  const esTecnica = nombre === 'sessions';
  const columnasFk = new Set(foraneas.filter((f) => f.tabla === nombre).map((f) => f.columna));
  const filas = columnas
    .map((columna, indice) => {
      const yFila = y + ALTO_CABECERA + indice * ALTO_FILA + 17;
      const esPk = columna.clave === 'PRI';
      const esFk = columnasFk.has(columna.columna);
      const marcas = [esPk && ['PK', COLORES.pk], esFk && ['FK', COLORES.fk]].filter(Boolean);
      return `
    ${marcas.map(([texto, color], posicion) => `<text x="${x + 10 + posicion * 20}" y="${yFila}" font-size="10" font-weight="700" fill="${color}">${texto}</text>`).join('')}
    <text x="${x + 54}" y="${yFila}" font-size="13" fill="${COLORES.texto}" font-weight="${esPk ? 700 : 400}">${escapar(columna.columna)}${columna.nulo === 'YES' ? '' : ' *'}</text>
    <text x="${x + ANCHO_TABLA - 12}" y="${yFila}" font-size="11" fill="${COLORES.suave}" text-anchor="end">${escapar(columna.tipo)}</text>`;
    })
    .join('');
  return `
  <g>
    <rect x="${x}" y="${y}" width="${ANCHO_TABLA}" height="${alto}" rx="12" fill="#ffffff" stroke="${COLORES.borde}" stroke-width="1.5"/>
    <path d="M${x} ${y + 12} a12 12 0 0 1 12 -12 h${ANCHO_TABLA - 24} a12 12 0 0 1 12 12 v${ALTO_CABECERA - 12} h-${ANCHO_TABLA} z" fill="${esTecnica ? COLORES.cabeceraTecnica : COLORES.cabecera}"/>
    <text x="${x + 14}" y="${y + 25}" font-size="16" font-weight="700" fill="#ffffff">${nombre}</text>
    ${filas}
  </g>`;
}

/** Línea entre la columna FK y la PK de la tabla destino, con "N" en el lado FK y "1" en el lado PK. */
function dibujarRelacion(relacion, indice, tablas) {
  const filaY = (tabla, columna) =>
    POSICIONES[tabla][1] +
    ALTO_CABECERA +
    tablas[tabla].findIndex((c) => c.columna === columna) * ALTO_FILA +
    12;
  const [xOrigen] = POSICIONES[relacion.tabla];
  const [xDestino] = POSICIONES[relacion.tablaDestino];
  const y1 = filaY(relacion.tabla, relacion.columna);
  const y2 = filaY(relacion.tablaDestino, relacion.columnaDestino);

  let x1;
  let x2;
  let xMedio;
  if (xOrigen === xDestino) {
    // Misma columna: la línea sale por la izquierda y rodea.
    x1 = xOrigen;
    x2 = xDestino;
    xMedio = xOrigen - 16 - (indice % 2) * 14;
  } else if (xOrigen < xDestino) {
    x1 = xOrigen + ANCHO_TABLA;
    x2 = xDestino;
    // Cada relación usa un carril vertical distinto para que las líneas no se encimen.
    xMedio = (x1 + x2) / 2 + ((indice % 3) - 1) * 16;
  } else {
    x1 = xOrigen;
    x2 = xDestino + ANCHO_TABLA;
    xMedio = (x1 + x2) / 2 + ((indice % 3) - 1) * 16;
  }
  const dirOrigen = x1 <= xMedio ? 1 : -1;
  const dirDestino = x2 <= xMedio ? 1 : -1;
  return `
  <path d="M${x1} ${y1} H${xMedio} V${y2} H${x2}" fill="none" stroke="${COLORES.linea}" stroke-width="1.8"/>
  <path d="M${x1 + dirOrigen * 12} ${y1} L${x1} ${y1 - 7} M${x1 + dirOrigen * 12} ${y1} L${x1} ${y1 + 7}" stroke="${COLORES.linea}" stroke-width="1.8"/>
  <text x="${x1 + dirOrigen * 16}" y="${y1 - 6}" font-size="12" font-weight="700" fill="${COLORES.linea}" text-anchor="${dirOrigen > 0 ? 'start' : 'end'}">N</text>
  <path d="M${x2 + dirDestino * 8} ${y2 - 7} V${y2 + 7}" stroke="${COLORES.linea}" stroke-width="2"/>
  <text x="${x2 + dirDestino * 14}" y="${y2 - 6}" font-size="12" font-weight="700" fill="${COLORES.linea}" text-anchor="${dirDestino > 0 ? 'start' : 'end'}">1</text>`;
}

async function generar() {
  const { tablas, foraneas } = await leerEstructura();
  const faltantes = Object.keys(POSICIONES).filter((nombre) => !tablas[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan tablas en la base: ${faltantes.join(', ')}. Ejecuta npm run db:init`);
  }
  const altoTotal =
    Math.max(
      ...Object.entries(POSICIONES).map(
        ([nombre, [, y]]) => y + ALTO_CABECERA + tablas[nombre].length * ALTO_FILA,
      ),
    ) + 80;
  const anchoTotal = POSICIONES.administradores[0] + ANCHO_TABLA + 40;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${anchoTotal}" height="${altoTotal}" viewBox="0 0 ${anchoTotal} ${altoTotal}" font-family="Segoe UI, Arial, sans-serif">
  <rect width="100%" height="100%" fill="#fff8f9"/>
  <text x="40" y="44" font-size="24" font-weight="700" fill="${COLORES.texto}">Diagrama entidad-relación · Base de datos "${config.db.database}" (MySQL 8.4)</text>
  <text x="40" y="68" font-size="13" fill="${COLORES.suave}">PK = llave primaria · FK = llave foránea · * = obligatorio (NOT NULL) · N──1 = muchos a uno · sessions es la tabla técnica de sesiones</text>
  ${foraneas.map((relacion, indice) => dibujarRelacion(relacion, indice, tablas)).join('')}
  ${Object.keys(POSICIONES)
    .map((nombre) => dibujarTabla(nombre, tablas[nombre], foraneas))
    .join('')}
</svg>`;

  const carpeta = path.join(config.raizProyecto, 'docs');
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, 'diagrama-entidad-relacion.svg'), svg, 'utf8');
  await sharp(Buffer.from(svg), { density: 110 })
    .png()
    .toFile(path.join(carpeta, 'diagrama-entidad-relacion.png'));
  console.log(
    `Diagrama con ${Object.keys(POSICIONES).length} tablas y ${foraneas.length} relaciones en docs/`,
  );
}

generar().catch((error) => {
  console.error('No se pudo generar el diagrama:', error.message);
  process.exitCode = 1;
});
