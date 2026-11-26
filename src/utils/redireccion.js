/**
 * Devuelve una ruta interna segura para redirigir después del login.
 * Evita redirecciones abiertas a otros sitios (OWASP): solo se aceptan rutas que empiezan con "/".
 */
function rutaSegura(ruta, porDefecto = '/') {
  if (typeof ruta !== 'string' || ruta.length > 200) {
    return porDefecto;
  }
  if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.includes('\\')) {
    return porDefecto;
  }
  return ruta;
}

module.exports = { rutaSegura };
