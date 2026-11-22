const bakiyeServisi = require('../services/bakiyeServisi');

// bazı bıcımlerı sınırlayacgım sonucta sonsuz sayı ekleyemezler. bu yzuden 10 ve 1000 arasında tanımlıyorub.
function tutarOku(deger) {
    const metin = String(deger === undefined || deger === null ? '' : deger).trim().replace(',', '.');
    return /^\d+(\.\d{1,2})?$/.test(metin) ? Number(metin) : null;
}

async function ozet(req, res) {
    res.json(await bakiyeServisi.ozetGetir(req.kullanici.id));
}

async function yukle(req, res) {
    const tutar = tutarOku((req.body || {}).tutar);
    if (tutar === null) {
        return res.status(400).json({ hata: 'Geçerli bir tutar girin.' });
    }
    try {
        res.status(201).json(await bakiyeServisi.yukle(req.kullanici.id, tutar));
    } catch (hata) {
        
        if (hata.kullaniciHatasi) return res.status(422).json({ hata: hata.message });
        throw hata;
    }
}

module.exports = { ozet, yukle };
