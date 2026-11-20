const rezervasyonServisi = require('../services/rezervasyonServisi');

async function yap(req, res) {
    const { menu_id } = req.body || {};
    if (!/^\d+$/.test(String(menu_id || '')) || Number(menu_id) <= 0) {
        return res.status(400).json({ hata: 'menu_id gereklidir.' });
    }

    try {
        const sonuc = await rezervasyonServisi.yap(req.kullanici.id, Number(menu_id));
        res.status(201).json(sonuc);
    } catch (hata) {
        
        if (hata.kullaniciHatasi) {
            return res.status(422).json({ hata: hata.message });
        }
        throw hata;
    }
}

module.exports = { yap };
