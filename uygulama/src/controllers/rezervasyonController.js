const rezervasyonServisi = require('../services/rezervasyonServisi');

const pozitifTamSayi = (d) => (/^\d+$/.test(String(d || '')) && Number(d) > 0 ? Number(d) : null);

// Stored procedure'ün Türkçe mesajı olduğu gibi arayüze gider.
function kullaniciHatasiysaYanitla(hata, res) {
    if (hata.kullaniciHatasi) {
        res.status(422).json({ hata: hata.message });
        return true;
    }
    return false;
}

async function yap(req, res) {
    const menuId = pozitifTamSayi((req.body || {}).menu_id);
    if (!menuId) {
        return res.status(400).json({ hata: 'menu_id gereklidir.' });
    }
    try {
        res.status(201).json(await rezervasyonServisi.yap(req.kullanici.id, menuId));
    } catch (hata) {
        if (!kullaniciHatasiysaYanitla(hata, res)) throw hata;
    }
}

async function listele(req, res) {
    const rezervasyonlar = await rezervasyonServisi.listele(req.kullanici.id);
    res.json({ rezervasyonlar });
}

async function iptal(req, res) {
    const rezervasyonId = pozitifTamSayi(req.params.id);
    if (!rezervasyonId) {
        return res.status(400).json({ hata: 'Geçersiz rezervasyon numarası.' });
    }
    try {
        res.json(await rezervasyonServisi.iptal(req.kullanici.id, rezervasyonId));
    } catch (hata) {
        if (!kullaniciHatasiysaYanitla(hata, res)) throw hata;
    }
}

module.exports = { yap, listele, iptal };
