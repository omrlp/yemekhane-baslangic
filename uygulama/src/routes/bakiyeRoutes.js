// Bakiye adresleri giris yapma sartı bunda da var
const express = require('express');
const bakiyeController = require('../controllers/bakiyeController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/bakiye', oturumGerekli, sar(bakiyeController.ozet));
router.post('/bakiye/yukle', oturumGerekli, sar(bakiyeController.yukle));

module.exports = router;
