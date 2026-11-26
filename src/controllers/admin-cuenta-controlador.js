const { buscarAdministradorPorEmail, registrarAcceso } = require('../models/administrador-modelo');
const { obtenerErrores } = require('../middlewares/validacion');
const { regenerarSesion, guardarSesion } = require('../middlewares/sesion');
const { claveCorrecta } = require('../utils/claves');
const { rutaSegura } = require('../utils/redireccion');

function renderizarIngreso(res, { email = '', error = '', volver = '/admin', estado = 200 } = {}) {
  res.status(estado).render('admin/ingresar', {
    titulo: 'Panel de administración | Perú Flowers',
    email,
    error,
    volver,
  });
}

function mostrarIngreso(req, res) {
  if (req.session.adminId) {
    return res.redirect('/admin');
  }
  renderizarIngreso(res, { volver: rutaSegura(req.query.volver, '/admin') });
}

async function ingresar(req, res) {
  const volver = rutaSegura(req.body.volver, '/admin');
  const destino = volver.startsWith('/admin') ? volver : '/admin';
  if (obtenerErrores(req)) {
    return renderizarIngreso(res, {
      email: req.body.email,
      error: 'Escribe tu correo y contraseña.',
      volver,
      estado: 422,
    });
  }
  const admin = await buscarAdministradorPorEmail(req.body.email);
  if (!(await claveCorrecta(req.body.password, admin?.password_hash))) {
    return renderizarIngreso(res, {
      email: req.body.email,
      error: 'Correo o contraseña incorrectos.',
      volver,
      estado: 401,
    });
  }
  await regenerarSesion(req);
  req.session.adminId = admin.id;
  req.session.adminNombre = admin.nombre;
  req.session.aviso = { tipo: 'exito', texto: `Bienvenida/o al panel, ${admin.nombre}.` };
  await guardarSesion(req);
  await registrarAcceso(admin.id);
  res.redirect(destino);
}

async function salir(req, res) {
  await regenerarSesion(req);
  res.redirect('/admin/ingresar');
}

module.exports = { mostrarIngreso, ingresar, salir };
