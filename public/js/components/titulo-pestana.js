import { prefiereMenosMovimiento } from '../utils/movimiento.js';

/**
 * Cuando el cliente cambia de pestaña, el título se desplaza en bucle desde la izquierda
 * con un mensaje de Perú Flowers. Usa un Web Worker como reloj porque los navegadores
 * frenan los temporizadores de las pestañas ocultas.
 */
const MENSAJE = '¡No te vayas! Vuelve 🥺 Tus flores te esperan 🌸';
const ANCHO_VISIBLE = 30;
const INTERVALO_MS = 300;

export function iniciarTituloPestana() {
  const tituloOriginal = document.title;
  const texto = `${MENSAJE}   `;
  let posicion = 0;
  let worker = null;

  function avanzar() {
    document.title = (texto + texto).substring(posicion, posicion + ANCHO_VISIBLE);
    posicion = (posicion + 1) % texto.length;
  }

  function detener() {
    worker?.terminate();
    worker = null;
    document.title = tituloOriginal;
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      detener();
      return;
    }
    // Con "reducir movimiento" el mensaje se muestra fijo, sin desplazarse.
    if (prefiereMenosMovimiento() || typeof Worker === 'undefined') {
      document.title = MENSAJE;
      return;
    }
    posicion = 0;
    avanzar();
    worker = new Worker('/js/workers/reloj-worker.js');
    worker.addEventListener('message', avanzar);
    worker.postMessage(INTERVALO_MS);
  });
}
