// Rangos de presupuesto sugeridos para el filtro del catálogo (HU02).
function crearEnlaceCatalogo({ ocasion, min, max } = {}) {
  const parametros = new URLSearchParams();
  if (ocasion) {
    parametros.set('ocasion', ocasion);
  }
  if (min !== undefined) {
    parametros.set('min', min);
  }
  if (max !== undefined) {
    parametros.set('max', max);
  }
  const consulta = parametros.toString();
  return consulta ? `/catalogo?${consulta}` : '/catalogo';
}

const RANGOS_PRESUPUESTO = [
  { etiqueta: 'Hasta S/ 80', min: undefined, max: 80 },
  { etiqueta: 'S/ 80 a S/ 150', min: 80, max: 150 },
  { etiqueta: 'S/ 150 a S/ 250', min: 150, max: 250 },
  { etiqueta: 'Más de S/ 250', min: 250, max: undefined },
].map((rango) => ({ ...rango, enlace: crearEnlaceCatalogo(rango) }));

// Productos que se muestran en "Nuestros favoritos" de la página de inicio (IDs del catálogo).
const IDS_DESTACADOS = [21, 34, 24, 36, 1, 25, 32, 35];

const LIMITE_PRECIO = 10000;

module.exports = { RANGOS_PRESUPUESTO, IDS_DESTACADOS, LIMITE_PRECIO, crearEnlaceCatalogo };
