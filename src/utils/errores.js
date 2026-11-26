/** Error con un mensaje pensado para el cliente (el manejador de errores sí lo muestra). */
function crearErrorVisible(mensaje, status = 400) {
  const error = new Error(mensaje);
  error.status = status;
  error.expose = true;
  return error;
}

module.exports = { crearErrorVisible };
