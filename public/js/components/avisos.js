// Avisos emergentes: se cierran solos después de unos segundos o con la X.
const DURACION_MS = 6000;

function cerrarAviso(aviso) {
  if (!aviso.isConnected || aviso.classList.contains('esta-saliendo')) {
    return;
  }
  aviso.classList.add('esta-saliendo');
  aviso.addEventListener('animationend', () => aviso.remove(), { once: true });
  // Respaldo por si las animaciones están desactivadas.
  window.setTimeout(() => aviso.remove(), 600);
}

function programarCierre(aviso) {
  aviso.querySelector('[data-cerrar-aviso]')?.addEventListener('click', () => cerrarAviso(aviso));
  window.setTimeout(() => cerrarAviso(aviso), DURACION_MS);
}

export function mostrarAviso(texto, tipo = 'exito') {
  const contenedor = document.querySelector('[data-avisos]');
  const plantilla = document.getElementById('plantilla-aviso');
  if (!contenedor || !plantilla) {
    return;
  }
  const aviso = plantilla.content.firstElementChild.cloneNode(true);
  aviso.classList.add(`aviso--${tipo}`);
  aviso.querySelector('[data-aviso-texto]').textContent = texto;
  const icono = { error: 'cerrar', info: 'flor' }[tipo];
  if (icono) {
    aviso.querySelector('use')?.setAttribute('href', `/img/iconos/iconos.svg#icono-${icono}`);
  }
  contenedor.append(aviso);
  programarCierre(aviso);
}

export function iniciarAvisos() {
  document.querySelectorAll('[data-avisos] [data-aviso]').forEach(programarCierre);
}
