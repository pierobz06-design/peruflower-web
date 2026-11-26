const { buscarClientePorEmail, crearCliente } = require('../models/cliente-modelo');
const { obtenerErrores } = require('../middlewares/validacion');
const { regenerarSesion, guardarSesion } = require('../middlewares/sesion');
const { rutaSegura } = require('../utils/redireccion');
const { cifrarClave, claveCorrecta } = require('../utils/claves');

function renderizarFormulario(
  res,
  vista,
  { valores = {}, errores = {}, volver = '/', estado = 200 },
) {
  const esRegistro = vista === 'registro';
  res.status(estado).render(`pages/${vista}`, {
    titulo: `${esRegistro ? 'Crear cuenta' : 'Iniciar sesión'} | Perú Flowers`,
    descripcion: 'Accede a tu cuenta de Perú Flowers para hacer tu pedido.',
    estilos: ['cuenta'],
    scripts: ['formularios'],
    valores,
    errores,
    volver,
  });
}

async function iniciarSesionCliente(req, cliente, mensaje) {
  await regenerarSesion(req);
  req.session.clienteId = cliente.id;
  req.session.clienteNombre = cliente.nombres.split(' ')[0];
  req.session.aviso = { tipo: 'exito', texto: mensaje };
  await guardarSesion(req);
}

function mostrarRegistro(req, res) {
  renderizarFormulario(res, 'registro', { volver: rutaSegura(req.query.volver) });
}

async function registrar(req, res) {
  const volver = rutaSegura(req.body.volver);
  const valores = { ...req.body, password: '', confirmarPassword: '' };
  const errores = obtenerErrores(req);
  if (errores) {
    return renderizarFormulario(res, 'registro', { valores, errores, volver, estado: 422 });
  }

  const { nombres, apellidos, email, telefono, password } = req.body;
  if (await buscarClientePorEmail(email)) {
    return renderizarFormulario(res, 'registro', {
      valores,
      errores: { email: 'Ya existe una cuenta con este correo. Inicia sesión.' },
      volver,
      estado: 409,
    });
  }

  const passwordHash = await cifrarClave(password);
  const id = await crearCliente({
    nombres,
    apellidos,
    email,
    telefono,
    passwordHash,
    aceptaPromociones: req.body.aceptaPromociones === 'si',
  });
  await iniciarSesionCliente(
    req,
    { id, nombres },
    `¡Te damos la bienvenida, ${nombres.split(' ')[0]}! Tu cuenta fue creada.`,
  );
  res.redirect(volver);
}

function mostrarIngreso(req, res) {
  renderizarFormulario(res, 'ingresar', { volver: rutaSegura(req.query.volver) });
}

async function ingresar(req, res) {
  const volver = rutaSegura(req.body.volver);
  const valores = { email: req.body.email };
  const errores = obtenerErrores(req);
  if (errores) {
    return renderizarFormulario(res, 'ingresar', { valores, errores, volver, estado: 422 });
  }

  const cliente = await buscarClientePorEmail(req.body.email);
  const passwordValida = await claveCorrecta(req.body.password, cliente?.password_hash);
  if (!passwordValida) {
    return renderizarFormulario(res, 'ingresar', {
      valores,
      errores: { general: 'Correo o contraseña incorrectos.' },
      volver,
      estado: 401,
    });
  }

  await iniciarSesionCliente(req, cliente, `¡Hola de nuevo, ${cliente.nombres.split(' ')[0]}!`);
  res.redirect(volver);
}

async function salir(req, res) {
  await regenerarSesion(req);
  req.session.aviso = { tipo: 'info', texto: 'Cerraste sesión. ¡Te esperamos pronto!' };
  await guardarSesion(req);
  res.redirect('/');
}

module.exports = { mostrarRegistro, registrar, mostrarIngreso, ingresar, salir };
