// Textos e imágenes de la página de inicio de Perú Flowers.
// Cada diapositiva lleva a un lugar distinto para no repetir el mismo destino.
const SLIDES = [
  {
    antetitulo: 'Florería familiar en Salamanca',
    titulo: 'Flores frescas que dicen lo que sientes',
    texto: 'Ramos y arreglos preparados el mismo día, con dedicatoria impresa incluida.',
    boton: { texto: 'Ver catálogo', enlace: '/catalogo' },
    imagen: '/img/banners/ramos-del-dia.webp',
    alt: 'Seis ramos de rosas, girasoles, tulipanes y gerberas envueltos en papel kraft',
  },
  {
    antetitulo: 'Cumpleaños',
    titulo: 'Celebra un año más con flores',
    texto: 'Rosas, girasoles y tulipanes para sorprender en su día especial.',
    boton: { texto: 'Regalos de cumpleaños', enlace: '/catalogo?ocasion=cumpleanos' },
    imagen: '/img/banners/ramos-de-temporada.webp',
    alt: 'Ramos de rosas y flores de temporada en tonos rosados y crema',
  },
  {
    antetitulo: 'Para Mamá',
    titulo: 'Para la mujer más importante',
    texto: 'Detalles llenos de color para agradecerle todo lo que hace.',
    boton: { texto: 'Detalles para mamá', enlace: '/catalogo?ocasion=para-mama' },
    imagen: '/img/banners/claveles-para-mama.webp',
    alt: 'Ramo de claveles rosados envuelto en papel kraft con cinta rosada',
  },
  {
    antetitulo: 'Delivery los 7 días',
    titulo: 'Llevamos tus flores a todo Lima y Callao',
    texto: 'Elige tu arreglo, dinos dónde entregarlo y nosotros nos encargamos del resto.',
    boton: { texto: 'Cómo comprar', enlace: '#como-comprar' },
    imagen: '/img/banners/delivery-lima-callao.webp',
    alt: 'Canasta con ramos de gerberas, mini rosas y flores de campo listos para entregar',
  },
];

// Sección informativa "Cómo comprar" (no son enlaces).
const PASOS_COMPRA = [
  {
    icono: 'flor',
    titulo: 'Elige tu arreglo',
    texto:
      'Busca por ocasión o por presupuesto. Todas las fotos son de arreglos reales hechos por nuestro equipo.',
  },
  {
    icono: 'camion',
    titulo: 'Dinos dónde y cuándo',
    texto:
      'Entregamos los 7 días en Lima y Callao. El envío se calcula según el distrito y la dedicatoria impresa va incluida.',
  },
  {
    icono: 'candado',
    titulo: 'Paga y nosotros lo preparamos',
    texto:
      'Al final de tu pedido eliges cómo pagar. Luego preparamos tus flores y las llevamos hasta la puerta.',
  },
];

module.exports = { SLIDES, PASOS_COMPRA };
