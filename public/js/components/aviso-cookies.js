// Aviso de cookies: se muestra hasta que el cliente pulsa "Entendido" (se recuerda en este navegador).
const CLAVE = 'pf-aviso-cookies';

function leerAceptado() {
  try {
    return window.localStorage.getItem(CLAVE) === 'si';
  } catch {
    return false;
  }
}

function guardarAceptado() {
  try {
    window.localStorage.setItem(CLAVE, 'si');
  } catch {
    // Si el navegador bloquea el almacenamiento, el aviso solo se cierra por esta visita.
  }
}

export function iniciarAvisoCookies() {
  const aviso = document.querySelector('[data-aviso-cookies]');
  if (!aviso || leerAceptado()) {
    return;
  }
  aviso.hidden = false;
  aviso.querySelector('[data-aceptar-cookies]').addEventListener('click', () => {
    guardarAceptado();
    aviso.classList.add('esta-saliendo');
    window.setTimeout(() => {
      aviso.hidden = true;
    }, 400);
  });
}
