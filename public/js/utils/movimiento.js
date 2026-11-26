// Respeta la opción del sistema "reducir movimiento".
const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefiereMenosMovimiento() {
  return consulta.matches;
}

export function alCambiarPreferenciaMovimiento(callback) {
  consulta.addEventListener('change', () => callback(consulta.matches));
}
