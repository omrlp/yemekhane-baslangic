const express = require('express');
const rezervasyonController = require('../controllers/rezervasyonController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/rezervasyon', oturumGerekli, sar(rezervasyonController.yap));

module.exports = router;
