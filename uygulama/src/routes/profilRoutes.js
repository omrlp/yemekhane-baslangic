const express = require('express');
const profilController = require('../controllers/profilController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/profil', oturumGerekli, sar(profilController.getir));
router.put('/profil/alerjenler', oturumGerekli, sar(profilController.alerjenleriKaydet));

module.exports = router;
