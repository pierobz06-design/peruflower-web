/** Exige que haya un cliente con sesión iniciada; si no, lo envía al login y luego lo regresa. */
function requiereCliente(req, res, next) {
  if (req.session.clienteId) {
    return next();
  }
  req.session.aviso = {
    tipo: 'info',
    texto: 'Inicia sesión o crea tu cuenta para continuar con tu pedido.',
  };
  res.redirect(`/ingresar?volver=${encodeURIComponent(req.originalUrl)}`);
}

/** Si el cliente ya inició sesión, no tiene sentido mostrarle el login o el registro. */
function soloInvitados(req, res, next) {
  if (req.session.clienteId) {
    return res.redirect('/');
  }
  next();
}

/** Panel de administración: solo personal con sesión de administrador. */
function requiereAdmin(req, res, next) {
  if (req.session.adminId) {
    return next();
  }
  res.redirect(`/admin/ingresar?volver=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = { requiereCliente, soloInvitados, requiereAdmin };
