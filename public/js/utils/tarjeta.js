/**
 * Validaciones de tarjeta compartidas por el navegador y el servidor (un solo lugar).
 * El servidor lo carga con require() gracias a public/js/package.json ("type": "module").
 */
export function limpiarNumeroTarjeta(valor) {
  return String(valor || '').replace(/[\s-]/g, '');
}

/** Algoritmo de Luhn: detecta números de tarjeta mal escritos. */
export function cumpleLuhn(numero) {
  const digitos = limpiarNumeroTarjeta(numero);
  if (!/^\d{13,19}$/.test(digitos)) {
    return false;
  }
  let suma = 0;
  let duplicar = false;
  for (let i = digitos.length - 1; i >= 0; i -= 1) {
    let digito = Number(digitos[i]);
    if (duplicar) {
      digito *= 2;
      if (digito > 9) {
        digito -= 9;
      }
    }
    suma += digito;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

export function detectarMarca(numero) {
  const digitos = limpiarNumeroTarjeta(numero);
  if (/^4/.test(digitos)) {
    return 'Visa';
  }
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digitos)) {
    return 'Mastercard';
  }
  if (/^3[47]/.test(digitos)) {
    return 'American Express';
  }
  if (/^3(0[0-5]|[68])/.test(digitos)) {
    return 'Diners Club';
  }
  return '';
}

export function longitudCvv(numero) {
  return detectarMarca(numero) === 'American Express' ? 4 : 3;
}

/** Vencimiento "MM/AA": válido si no venció y no supera 20 años. */
export function vencimientoValido(texto, ahora = new Date()) {
  const coincidencia = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(String(texto || '').trim());
  if (!coincidencia) {
    return false;
  }
  const mes = Number(coincidencia[1]);
  const anio = 2000 + Number(coincidencia[2]);
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;
  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    return false;
  }
  return anio <= anioActual + 20;
}
