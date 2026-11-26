// Panel de administración: menú en celular, confirmaciones, vista previa de foto y filtros.
import { iniciarAvisos, mostrarAviso } from '../components/avisos.js';
import '../pages/formularios.js';

function iniciarMenu() {
  const barra = document.querySelector('[data-admin-barra]');
  const boton = document.querySelector('[data-admin-menu]');
  if (!barra || !boton) {
    return;
  }
  boton.addEventListener('click', () => {
    const abierta = barra.classList.toggle('es-abierta');
    boton.setAttribute('aria-expanded', String(abierta));
  });
}

/** Pide confirmación antes de acciones como ocultar un producto. */
function iniciarConfirmaciones() {
  document.addEventListener('submit', (evento) => {
    const boton = evento.submitter;
    if (boton?.dataset.confirmar && !window.confirm(boton.dataset.confirmar)) {
      evento.preventDefault();
    }
  });
}

/** Vista previa de la foto elegida y aviso si pesa demasiado. */
function iniciarVistaFoto() {
  const entrada = document.getElementById('imagen');
  const vista = document.querySelector('[data-vista-foto-imagen]');
  if (!entrada || !vista) {
    return;
  }
  let urlTemporal = null;
  entrada.addEventListener('change', () => {
    const archivo = entrada.files[0];
    if (!archivo) {
      return;
    }
    const maximoMb = Number(entrada.dataset.tamanoMaximo) || 4;
    if (archivo.size > maximoMb * 1024 * 1024) {
      entrada.value = '';
      mostrarAviso(`La foto no debe pesar más de ${maximoMb} MB.`, 'error');
      return;
    }
    if (urlTemporal) {
      URL.revokeObjectURL(urlTemporal);
    }
    urlTemporal = URL.createObjectURL(archivo);
    vista.src = urlTemporal;
  });
}

/** El filtro de estado se aplica al elegirlo. */
function iniciarFiltrosPedidos() {
  const formulario = document.querySelector('[data-filtros-pedidos]');
  formulario?.querySelectorAll('[data-envio-automatico]').forEach((campo) => {
    campo.addEventListener('change', () => formulario.requestSubmit());
  });
}

iniciarAvisos();
iniciarMenu();
iniciarConfirmaciones();
iniciarVistaFoto();
iniciarFiltrosPedidos();
