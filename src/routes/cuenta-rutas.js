const { Router } = require('express');
const cuenta = require('../controllers/cuenta-controlador');
const { reglasRegistro, reglasIngreso } = require('../middlewares/validar-cliente');
const { soloInvitados } = require('../middlewares/autenticacion');
const { limitarAcceso } = require('../middlewares/limitadores');

const router = Router();

router.get('/registro', soloInvitados, cuenta.mostrarRegistro);
router.post('/registro', soloInvitados, limitarAcceso, reglasRegistro, cuenta.registrar);
router.get('/ingresar', soloInvitados, cuenta.mostrarIngreso);
router.post('/ingresar', soloInvitados, limitarAcceso, reglasIngreso, cuenta.ingresar);
router.post('/salir', cuenta.salir);

module.exports = router;
