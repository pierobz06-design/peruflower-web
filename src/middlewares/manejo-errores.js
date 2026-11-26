/**
 * Manejo centralizado de errores: el cliente nunca ve detalles técnicos,
 * solo un mensaje claro. El detalle queda en la consola del servidor.
 */
const TITULOS = {
  400: 'Revisa los datos enviados',
  401: 'Necesitas iniciar sesión',
  403: 'No pudimos procesar tu solicitud',
  404: 'No encontramos esta página',
  429: 'Demasiados intentos',
  500: 'Tuvimos un problema',
};

const TEXTOS = {
  404: 'Es posible que el enlace haya cambiado o que el arreglo ya no esté disponible.',
  500: 'Ocurrió un inconveniente en nuestro sistema. Por favor, inténtalo nuevamente en unos minutos.',
};

function responderError(req, res, estado, textoVisible) {
  const titulo = TITULOS[estado] || TITULOS[500];
  const texto = textoVisible || TEXTOS[estado] || TEXTOS[500];
  res.status(estado);

  // La API del carrito y las peticiones fetch reciben JSON.
  if (req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json') {
    return res.json({ error: texto });
  }

  res.render(
    'pages/error',
    { titulo: `${titulo} | Perú Flowers`, estilos: ['error'], estado, mensaje: { titulo, texto } },
    (errorVista, html) => {
      // Si la vista también falla (por ejemplo, sin base de datos), se envía texto simple.
      if (errorVista) {
        res.type('text/plain; charset=utf-8').send(`${titulo}. ${texto}`);
        return;
      }
      res.send(html);
    },
  );
}

function rutaNoEncontrada(req, res) {
  responderError(req, res, 404);
}

// Express reconoce un manejador de errores porque recibe 4 parámetros (por eso se declara _next).
function manejarErrores(error, req, res, _next) {
  const estado = error.status && error.status < 500 ? error.status : 500;
  if (estado >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  }
  if (res.headersSent) {
    return;
  }
  const textoVisible = estado < 500 && error.expose ? error.message : null;
  responderError(req, res, estado, textoVisible);
}

module.exports = { rutaNoEncontrada, manejarErrores };
