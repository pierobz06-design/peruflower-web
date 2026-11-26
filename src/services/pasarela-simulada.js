/**
 * Pasarela de pago SIMULADA (modo de pruebas). No se conecta a ningún banco ni cobra dinero.
 * Imita la respuesta de una pasarela real para demostrar el flujo de HU11.
 * Nunca guarda ni registra el número de tarjeta: solo devuelve los últimos 4 dígitos.
 */
const crypto = require('node:crypto');
const { limpiarNumeroTarjeta, detectarMarca } = require('../../public/js/utils/tarjeta.js');

// Tarjetas de prueba que la pasarela rechaza para demostrar un pago fallido.
const TARJETAS_RECHAZADAS = new Map([
  ['4000000000000002', 'Tu banco rechazó el pago. Prueba con otra tarjeta o elige otro método.'],
  ['4000000000009995', 'La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.'],
]);

const TARJETAS_DE_PRUEBA = [
  { numero: '4111 1111 1111 1111', marca: 'Visa', resultado: 'Aprobada' },
  { numero: '5555 5555 5555 4444', marca: 'Mastercard', resultado: 'Aprobada' },
  { numero: '4000 0000 0000 0002', marca: 'Visa', resultado: 'Rechazada' },
];

const DEMORA_MS = 900;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function procesarPagoTarjeta({ numeroTarjeta, monto }) {
  const numero = limpiarNumeroTarjeta(numeroTarjeta);
  await esperar(DEMORA_MS);
  const ultimos4 = numero.slice(-4);
  const marca = detectarMarca(numero) || 'Tarjeta';

  const motivoRechazo = TARJETAS_RECHAZADAS.get(numero);
  if (motivoRechazo) {
    return { aprobado: false, mensaje: motivoRechazo, ultimos4, marca };
  }
  return {
    aprobado: true,
    codigoAutorizacion: crypto.randomBytes(3).toString('hex').toUpperCase(),
    ultimos4,
    marca,
    monto,
  };
}

module.exports = { procesarPagoTarjeta, TARJETAS_DE_PRUEBA };
