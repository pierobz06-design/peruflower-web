/**
 * Validación de formularios en el navegador (el servidor vuelve a validar todo).
 * Muestra el mensaje debajo de cada campo, marca aria-invalid y enfoca el primer error.
 */
const MENSAJES_GENERALES = {
  valueMissing: 'Este campo es obligatorio.',
  typeMismatch: 'Revisa el formato de este dato.',
  tooShort: 'Es demasiado corto.',
  tooLong: 'Es demasiado largo.',
  patternMismatch: 'Revisa el formato de este dato.',
  rangeUnderflow: 'El valor es menor al permitido.',
  rangeOverflow: 'El valor es mayor al permitido.',
};

function mensajeDeError(campo) {
  const validez = campo.validity;
  const datos = campo.dataset;
  if (validez.valueMissing) {
    return datos.mensajeRequerido || MENSAJES_GENERALES.valueMissing;
  }
  if (validez.typeMismatch && campo.type === 'email') {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  if (validez.tooShort) {
    return `Debe tener al menos ${campo.minLength} caracteres.`;
  }
  if (validez.patternMismatch) {
    return datos.mensajePatron || MENSAJES_GENERALES.patternMismatch;
  }
  if (validez.rangeUnderflow || validez.rangeOverflow) {
    return datos.mensajeRango || MENSAJES_GENERALES.rangeUnderflow;
  }
  if (validez.customError) {
    return campo.validationMessage;
  }
  const tipo = Object.keys(MENSAJES_GENERALES).find((clave) => validez[clave]);
  return MENSAJES_GENERALES[tipo] || 'Revisa este campo.';
}

function validarCampo(campo) {
  // Confirmación de contraseña: debe coincidir con el campo indicado.
  if (campo.dataset.coincideCon) {
    const original = document.getElementById(campo.dataset.coincideCon);
    campo.setCustomValidity(
      campo.value && original && campo.value !== original.value
        ? campo.dataset.mensajeCoincide || 'Los valores no coinciden.'
        : '',
    );
  }
  const valido = campo.checkValidity();
  const contenedorError = document.querySelector(`[data-error-de="${campo.id}"]`);
  if (contenedorError) {
    contenedorError.textContent = valido ? '' : mensajeDeError(campo);
  }
  if (valido) {
    campo.removeAttribute('aria-invalid');
  } else {
    campo.setAttribute('aria-invalid', 'true');
  }
  campo.closest('.campo, .casilla')?.classList.toggle('campo--error', !valido);
  return valido;
}

function iniciarValidacion(formulario) {
  const campos = () =>
    [...formulario.querySelectorAll('input, select, textarea')].filter(
      (campo) => campo.type !== 'hidden' && campo.willValidate,
    );

  formulario.addEventListener('submit', (evento) => {
    const invalidos = campos().filter((campo) => !validarCampo(campo));
    if (invalidos.length > 0) {
      evento.preventDefault();
      invalidos[0].focus();
      return;
    }
    // Evita envíos dobles.
    formulario.querySelectorAll('[type="submit"]').forEach((boton) => {
      boton.disabled = true;
    });
  });

  formulario.addEventListener(
    'blur',
    (evento) => {
      const campo = evento.target;
      if (campo.matches('input, select, textarea') && campo.value !== '') {
        validarCampo(campo);
      }
    },
    true,
  );

  formulario.addEventListener('change', (evento) => {
    if (evento.target.matches('input[type="checkbox"], select')) {
      validarCampo(evento.target);
    }
  });
}

/** Botón "Mostrar" / "Ocultar" para las contraseñas. */
function iniciarMostrarClave(campo) {
  const envoltura = document.createElement('div');
  envoltura.className = 'clave';
  campo.parentNode.insertBefore(envoltura, campo);
  envoltura.append(campo);
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'clave__boton';
  boton.textContent = 'Mostrar';
  boton.setAttribute('aria-label', 'Mostrar contraseña');
  boton.addEventListener('click', () => {
    const visible = campo.type === 'text';
    campo.type = visible ? 'password' : 'text';
    boton.textContent = visible ? 'Mostrar' : 'Ocultar';
    boton.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
  });
  envoltura.append(boton);
}

/** Celulares: solo se permiten dígitos. */
function iniciarSoloDigitos(campo) {
  campo.addEventListener('input', () => {
    const limpio = campo.value.replace(/\D/g, '').slice(0, Number(campo.maxLength) || 9);
    if (limpio !== campo.value) {
      campo.value = limpio;
    }
  });
}

/** Contador de caracteres (dedicatoria). */
function iniciarContador(campo) {
  const valor = document
    .getElementById(campo.dataset.contador)
    ?.querySelector('[data-contador-valor]');
  if (!valor) {
    return;
  }
  campo.addEventListener('input', () => {
    valor.textContent = campo.value.length;
  });
}

document.querySelectorAll('form[data-validar]').forEach(iniciarValidacion);
document.querySelectorAll('[data-mostrar-clave]').forEach(iniciarMostrarClave);
document.querySelectorAll('[data-solo-digitos]').forEach(iniciarSoloDigitos);
document.querySelectorAll('[data-contador]').forEach(iniciarContador);
