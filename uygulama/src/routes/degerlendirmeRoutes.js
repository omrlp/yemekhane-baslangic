//degerlendırmek ıcın gırıs sartıı
const express = require('express');
const degerlendirmeController = require('../controllers/degerlendirmeController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/degerlendirmelerim', oturumGerekli, sar(degerlendirmeController.listele));
router.post('/degerlendirme', oturumGerekli, sar(degerlendirmeController.ekle));

module.exports = router;
