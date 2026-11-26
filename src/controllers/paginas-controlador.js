function mostrarPrivacidad(req, res) {
  res.render('pages/privacidad', {
    titulo: 'Política de privacidad | Perú Flowers',
    descripcion:
      'Cómo Perú Flowers protege tus datos personales conforme a la Ley N.° 29733 y su reglamento.',
    estilos: ['legal'],
  });
}

module.exports = { mostrarPrivacidad };
