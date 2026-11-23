//digerleri gibi burda ıse dair hıcbır sey yok
const degerlendirmeServisi = require('../services/degerlendirmeServisi');

async function listele(req, res) {
    const menuler = await degerlendirmeServisi.listele(req.kullanici.id);
    res.json({ menuler });
}

async function ekle(req, res) {
    const { menu_id, puan, yorum } = req.body || {};
    if (!/^\d+$/.test(String(menu_id || '')) || Number(menu_id) <= 0) {
        return res.status(400).json({ hata: 'menu_id gereklidir.' });
    }
    try {
        const sonuc = await degerlendirmeServisi.ekle(req.kullanici.id, Number(menu_id), Number(puan), yorum);
        res.status(201).json(sonuc);
    } catch (hata) {
        if (hata.kullaniciHatasi) return res.status(422).json({ hata: hata.message });
        throw hata;
    }
}

module.exports = { listele, ekle };
