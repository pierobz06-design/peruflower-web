/**
 * Peticiones JSON al servidor con el token CSRF de la página.
 * Si el servidor responde con error, lanza un Error con el mensaje para el cliente.
 */
const tokenCsrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

export async function pedirJson(metodo, url, datos) {
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': tokenCsrf,
      },
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch {
    throw new Error('No pudimos conectarnos. Revisa tu conexión a internet e inténtalo otra vez.');
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(cuerpo.error || 'Ocurrió un problema. Inténtalo nuevamente.');
  }
  return cuerpo;
}
