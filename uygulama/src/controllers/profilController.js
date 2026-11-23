const profilServisi = require('../services/profilServisi');

async function getir(req, res) {
    res.json(await profilServisi.getir(req.kullanici));
}

async function alerjenleriKaydet(req, res) {
    try {
        res.json(await profilServisi.alerjenleriKaydet(req.kullanici.id, (req.body || {}).alerjen_idleri));
    } catch (hata) {
        if (hata.kullaniciHatasi) return res.status(422).json({ hata: hata.message });
        throw hata;
    }
}

module.exports = { getir, alerjenleriKaydet };
