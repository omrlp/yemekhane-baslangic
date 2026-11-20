// Menu adreslerı ıcın gırıs yapmak gerekıyror
const express = require('express');
const menuController = require('../controllers/menuController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/referans', oturumGerekli, sar(menuController.referans));
router.get('/menu/gunluk', oturumGerekli, sar(menuController.gunluk));
router.get('/menu/haftalik', oturumGerekli, sar(menuController.haftalik));

module.exports = router;
