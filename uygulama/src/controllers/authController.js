// İstek/yanıt olayları burada 
const bcrypt = require('bcryptjs');
const kullaniciRepository = require('../repositories/kullaniciRepository');
const oturumServisi = require('../services/oturumServisi');
const { cerezOku, cerezAyarla, CEREZ_ADI } = require('../middleware/oturumKontrol');

// Kullanıcı bulunamazsa bcrypt çalışsın diye cunku bılgı sızma olasılıgı olabılır
const SAHTE_HASH = '$2a$10$u7ChN/dOQrLshaRTmQUpA.GnpVq3OaE23uRvouRr/kt5mCmQ4CP5e';

async function giris(req, res) {
    const { eposta, sifre } = req.body || {};
    if (typeof eposta !== 'string' || typeof sifre !== 'string' || !eposta.trim() || !sifre) {
        return res.status(400).json({ hata: 'E-posta ve şifre gereklidir.' });
    }

    const kullanici = await kullaniciRepository.epostaIleBul(eposta.trim());
    const dogru = await bcrypt.compare(sifre, kullanici ? kullanici.sifre_hash : SAHTE_HASH);

    if (!kullanici || !dogru) {
        return res.status(401).json({ hata: 'E-posta veya şifre hatalı.' });
    }
    if (!kullanici.aktif) {
        return res.status(403).json({ hata: 'Hesabınız pasif durumda.' });
    }

    const oturumVerisi = {
        id: kullanici.id,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        eposta: kullanici.eposta,
        rol: kullanici.rol
    };
    const token = await oturumServisi.olustur(oturumVerisi);
    cerezAyarla(res, token);
    console.log(`[oturum] giriş: kullanici=${kullanici.id} rol=${kullanici.rol}`);
    res.json({ kullanici: oturumVerisi });
}

async function cikis(req, res) {
    await oturumServisi.sil(cerezOku(req, CEREZ_ADI));
    res.clearCookie(CEREZ_ADI, { path: '/' });
    res.json({ mesaj: 'Çıkış yapıldı.' });
}

function ben(req, res) {
    res.json({ kullanici: req.kullanici });
}

module.exports = { giris, cikis, ben };
