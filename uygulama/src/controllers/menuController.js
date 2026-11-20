const menuServisi = require('../services/menuServisi');

function pozitifTamSayi(deger) {
    return /^\d+$/.test(String(deger || '')) && Number(deger) > 0 ? Number(deger) : null;
}

async function referans(req, res) {
    res.json(await menuServisi.referansGetir());
}

async function gunluk(req, res) {
    const yemekhaneId = pozitifTamSayi(req.query.yemekhane_id);
    const ogunId = pozitifTamSayi(req.query.ogun_id);
    if (!yemekhaneId || !ogunId) {
        return res.status(400).json({ hata: 'yemekhane_id ve ogun_id gereklidir.' });
    }

    const menu = await menuServisi.gunlukMenuGetir(yemekhaneId, ogunId, req.kullanici.rol);
    if (!menu) {
        return res.status(404).json({ hata: 'Bu yemekhane ve öğün için bugün menü yok.' });
    }
    res.json({ menu });
}

async function haftalik(req, res) {
    const yemekhaneId = pozitifTamSayi(req.query.yemekhane_id);
    if (!yemekhaneId) {
        return res.status(400).json({ hata: 'yemekhane_id gereklidir.' });
    }
    const menuler = await menuServisi.haftalikMenuGetir(yemekhaneId, req.kullanici);
    res.json({ menuler });
}

module.exports = { referans, gunluk, haftalik };
