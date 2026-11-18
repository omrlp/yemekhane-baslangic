// Hangi URL hangi controllera gıdıyorsa onları belırtıyor aslında.
const express = require('express');
const authController = require('../controllers/authController');
const { oturumGerekli } = require('../middleware/oturumKontrol');

const router = express.Router();
const sar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/giris', sar(authController.giris));
router.post('/cikis', sar(authController.cikis));
router.get('/ben', oturumGerekli, authController.ben);

module.exports = router;
