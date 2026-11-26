import { atraparFoco, bloquearScroll } from '../utils/panel.js';

/** Panel de filtros deslizable en celular (en computadora queda fijo a la izquierda). */
function iniciarPanelFiltros() {
  const panel = document.querySelector('[data-panel-filtros]');
  const botonAbrir = document.querySelector('[data-abrir-filtros]');
  const fondo = document.querySelector('.filtros__fondo');
  if (!panel || !botonAbrir) {
    return;
  }
  let quitarTrampaFoco = null;

  function abrir() {
    panel.classList.add('es-abierto');
    fondo.hidden = false;
    botonAbrir.setAttribute('aria-expanded', 'true');
    bloquearScroll(true);
    quitarTrampaFoco = atraparFoco(panel, cerrar);
    panel.querySelector('input, button')?.focus();
  }

  function cerrar() {
    panel.classList.remove('es-abierto');
    fondo.hidden = true;
    botonAbrir.setAttribute('aria-expanded', 'false');
    bloquearScroll(false);
    quitarTrampaFoco?.();
    botonAbrir.focus();
  }

  botonAbrir.addEventListener('click', abrir);
  document.querySelectorAll('[data-cerrar-filtros]').forEach((elemento) => {
    elemento.addEventListener('click', cerrar);
  });
}

/** Sincroniza los dos deslizadores de precio con los campos numéricos. */
function iniciarRangoDoble() {
  const raiz = document.querySelector('[data-rango-doble]');
  if (!raiz) {
    return;
  }
  const minimo = Number(raiz.dataset.minimo);
  const maximo = Number(raiz.dataset.maximo);
  const pista = raiz.querySelector('[data-rango-pista]');
  const deslizadorMin = raiz.querySelector('[data-rango-deslizador="min"]');
  const deslizadorMax = raiz.querySelector('[data-rango-deslizador="max"]');
  const entradaMin = raiz.querySelector('[data-rango-entrada="min"]');
  const entradaMax = raiz.querySelector('[data-rango-entrada="max"]');
  if (maximo <= minimo) {
    return;
  }
  pista.hidden = false;

  const porcentaje = (valor) => ((valor - minimo) / (maximo - minimo)) * 100;

  function pintarPista() {
    pista.style.setProperty('--inicio', `${porcentaje(Number(deslizadorMin.value))}%`);
    pista.style.setProperty('--fin', `${porcentaje(Number(deslizadorMax.value))}%`);
  }

  function desdeDeslizador(evento) {
    let valorMin = Number(deslizadorMin.value);
    let valorMax = Number(deslizadorMax.value);
    if (valorMin > valorMax) {
      if (evento.target === deslizadorMin) {
        valorMin = valorMax;
        deslizadorMin.value = valorMin;
      } else {
        valorMax = valorMin;
        deslizadorMax.value = valorMax;
      }
    }
    entradaMin.value = valorMin > minimo ? valorMin : '';
    entradaMax.value = valorMax < maximo ? valorMax : '';
    pintarPista();
  }

  function desdeEntrada() {
    deslizadorMin.value = entradaMin.value || minimo;
    deslizadorMax.value = entradaMax.value || maximo;
    pintarPista();
  }

  deslizadorMin.addEventListener('input', desdeDeslizador);
  deslizadorMax.addEventListener('input', desdeDeslizador);
  entradaMin.addEventListener('input', desdeEntrada);
  entradaMax.addEventListener('input', desdeEntrada);
  pintarPista();
}

iniciarPanelFiltros();
iniciarRangoDoble();
