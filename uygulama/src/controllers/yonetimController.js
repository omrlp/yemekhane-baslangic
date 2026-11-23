const yonetimServisi = require('../services/yonetimServisi');

const pozitifTamSayi = (d) => (/^\d+$/.test(String(d || '')) && Number(d) > 0 ? Number(d) : null);

//hatalar turkce gıdıyor
function hataYanitla(hata, res) {
    if (hata.kullaniciHatasi) {
        res.status(hata.durum || 422).json({ hata: hata.message });
        return true;
    }
    return false;
}

async function yemekler(req, res) {
    res.json({ yemekler: await yonetimServisi.yemekleriListele() });
}

async function listele(req, res) {
    const yemekhaneId = pozitifTamSayi(req.query.yemekhane_id);
    if (!yemekhaneId) return res.status(400).json({ hata: 'yemekhane_id gereklidir.' });
    res.json({ menuler: await yonetimServisi.menuleriListele(yemekhaneId) });
}

async function detay(req, res) {
    const menuId = pozitifTamSayi(req.params.id);
    if (!menuId) return res.status(400).json({ hata: 'Geçersiz menü numarası.' });
    try {
        res.json(await yonetimServisi.menuDetay(menuId));
    } catch (hata) {
        if (!hataYanitla(hata, res)) throw hata;
    }
}

async function olustur(req, res) {
    try {
        res.status(201).json(await yonetimServisi.olustur(req.body || {}));
    } catch (hata) {
        if (!hataYanitla(hata, res)) throw hata;
    }
}

async function guncelle(req, res) {
    const menuId = pozitifTamSayi(req.params.id);
    if (!menuId) return res.status(400).json({ hata: 'Geçersiz menü numarası.' });
    try {
        res.json(await yonetimServisi.guncelle(menuId, req.body || {}));
    } catch (hata) {
        if (!hataYanitla(hata, res)) throw hata;
    }
}

module.exports = { yemekler, listele, detay, olustur, guncelle };
