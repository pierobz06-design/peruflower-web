import {
  limpiarNumeroTarjeta,
  cumpleLuhn,
  detectarMarca,
  longitudCvv,
  vencimientoValido,
} from '../utils/tarjeta.js';
import { pedirJson } from '../utils/api.js';
import { mostrarAviso } from '../components/avisos.js';

/** Formato del número mientras se escribe: 4111 1111 1111 1111 (Amex: 3782 822463 10005). */
function formatearNumero(digitos) {
  if (detectarMarca(digitos) === 'American Express') {
    return [digitos.slice(0, 4), digitos.slice(4, 10), digitos.slice(10, 15)]
      .filter(Boolean)
      .join(' ');
  }
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function iniciarFormularioTarjeta() {
  const formulario = document.querySelector('[data-form-tarjeta]');
  if (!formulario) {
    return;
  }
  const numero = formulario.querySelector('[data-tarjeta-numero]');
  const marca = formulario.querySelector('[data-tarjeta-marca]');
  const vencimiento = formulario.querySelector('[data-tarjeta-vencimiento]');
  const cvv = formulario.querySelector('[data-tarjeta-cvv]');

  numero.addEventListener('input', () => {
    const digitos = limpiarNumeroTarjeta(numero.value).replace(/\D/g, '').slice(0, 19);
    numero.value = formatearNumero(digitos);
    marca.textContent = detectarMarca(digitos);
    cvv.maxLength = longitudCvv(digitos);
    numero.setCustomValidity(
      digitos.length >= 13 && !cumpleLuhn(digitos)
        ? 'El número de tarjeta no es válido. Revísalo.'
        : '',
    );
  });

  vencimiento.addEventListener('input', (evento) => {
    let digitos = vencimiento.value.replace(/\D/g, '').slice(0, 4);
    // Agrega la barra automáticamente: "1230" -> "12/30"
    if (
      digitos.length > 2 ||
      (digitos.length === 2 && evento.inputType !== 'deleteContentBackward')
    ) {
      digitos = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    vencimiento.value = digitos;
    vencimiento.setCustomValidity(
      vencimiento.value.length === 5 && !vencimientoValido(vencimiento.value)
        ? 'La tarjeta está vencida o la fecha no es válida.'
        : '',
    );
  });

  cvv.addEventListener('input', () => {
    const esperado = longitudCvv(numero.value);
    cvv.setCustomValidity(
      cvv.value && cvv.value.length !== esperado ? `El CVV debe tener ${esperado} dígitos.` : '',
    );
  });

  // Indicador de carga mientras la pasarela simulada responde.
  formulario.addEventListener('submit', (evento) => {
    if (evento.defaultPrevented) {
      return;
    }
    const boton = formulario.querySelector('.boton--procesar');
    boton.classList.add('esta-procesando');
    boton.querySelector('.boton__texto').textContent = boton.dataset.textoProcesando;
  });
}

/** "Continuar por WhatsApp": guarda el método y abre WhatsApp en otra pestaña. */
function iniciarWhatsapp() {
  const formulario = document.querySelector('[data-form-whatsapp]');
  if (!formulario) {
    return;
  }
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    // La pestaña se abre durante el clic para que el navegador no la bloquee.
    const pestana = window.open('', '_blank');
    try {
      const respuesta = await pedirJson('POST', formulario.action);
      if (pestana) {
        pestana.opener = null;
        pestana.location.href = respuesta.enlaceWhatsapp;
      }
      window.location.href = respuesta.confirmacion;
    } catch (error) {
      pestana?.close();
      boton.disabled = false;
      mostrarAviso(error.message, 'error');
    }
  });
}

function iniciarCopiar() {
  document.querySelectorAll('[data-copiar]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(boton.dataset.copiar);
        mostrarAviso('Número copiado. Pégalo en tu app de Yape o Plin.');
      } catch {
        mostrarAviso('No pudimos copiar el número. Escríbelo manualmente.', 'error');
      }
    });
  });
}

iniciarFormularioTarjeta();
iniciarWhatsapp();
iniciarCopiar();
