// Mismo formato de precios que el servidor: 179 -> "S/ 179.00"
const formateadorSoles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

export function formatearPrecio(monto) {
  return formateadorSoles.format(Number(monto) || 0);
}
