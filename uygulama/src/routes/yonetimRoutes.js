//yonetıcı olmakzoryunda
const express = require('express');
const yonetimController = require('../controllers/yonetimController');
const { oturumGerekli, rolGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const yonetici = [oturumGerekli, rolGerekli('yonetici')];

router.get('/yonetim/yemekler', yonetici, sar(yonetimController.yemekler));
router.get('/yonetim/menuler', yonetici, sar(yonetimController.listele));
router.get('/yonetim/menuler/:id', yonetici, sar(yonetimController.detay));
router.post('/yonetim/menuler', yonetici, sar(yonetimController.olustur));
router.put('/yonetim/menuler/:id', yonetici, sar(yonetimController.guncelle));

module.exports = router;
