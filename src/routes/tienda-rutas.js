const { Router } = require('express');
const { mostrarInicio } = require('../controllers/inicio-controlador');
const { mostrarCatalogo } = require('../controllers/catalogo-controlador');
const { mostrarProducto } = require('../controllers/producto-controlador');
const { mostrarPrivacidad } = require('../controllers/paginas-controlador');
const { validarFiltrosCatalogo } = require('../middlewares/validar-catalogo');

const router = Router();

router.get('/', mostrarInicio);
router.get('/catalogo', validarFiltrosCatalogo, mostrarCatalogo);
router.get('/producto/:slug', mostrarProducto);
router.get('/politica-de-privacidad', mostrarPrivacidad);

module.exports = router;
