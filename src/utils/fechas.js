// Fechas en la zona horaria de Lima (UTC-5), en formato AAAA-MM-DD.
const formateadorLima = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function fechaHoyLima() {
  return formateadorLima.format(new Date());
}

function sumarDias(fechaIso, dias) {
  const fecha = new Date(`${fechaIso}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

const formateadorLargo = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "2026-11-21" -> "sábado, 21 de noviembre de 2026" */
function formatearFechaLarga(fechaIso) {
  return formateadorLargo.format(new Date(`${String(fechaIso).slice(0, 10)}T12:00:00Z`));
}

module.exports = { fechaHoyLima, sumarDias, formatearFechaLarga };
