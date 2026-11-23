
//puanlar 1 den 5 e kadar ve yorum uzunlugu maks 500 
//kısı ogun basına 1 oy hakkı ve sadece yıyenler yorum yapabılır
const degerlendirmeRepository = require('../repositories/degerlendirmeRepository');

function kullaniciHatasi(mesaj) {
    const hata = new Error(mesaj);
    hata.kullaniciHatasi = true;
    return hata;
}

async function listele(kullaniciId) {
    const satirlar = await degerlendirmeRepository.kullanilanMenuler(kullaniciId);
    return satirlar.map((s) => ({
        menu_id: s.menu_id,
        tarih: s.tarih,
        yemekhane: s.yemekhane,
        ogun: s.ogun,
        puan: s.puan === null ? null : Number(s.puan),
        yorum: s.yorum,
        oy_sayisi: Number(s.oy_sayisi || 0),
        ortalama_puan: s.ortalama_puan === null ? null : Number(s.ortalama_puan)
    }));
}

async function ekle(kullaniciId, menuId, puan, yorum) {
    if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
        throw kullaniciHatasi('Puan 1 ile 5 arasında olmalıdır.');
    }
    const temizYorum = typeof yorum === 'string' ? yorum.trim() : '';
    if (temizYorum.length > 500) {
        throw kullaniciHatasi('Yorum en çok 500 karakter olabilir.');
    }

    const sonuc = await degerlendirmeRepository.ekle(kullaniciId, menuId, puan, temizYorum || null);
    if (sonuc === 'hak_yok') {
        throw kullaniciHatasi('Yalnızca kullandığınız menüyü değerlendirebilirsiniz.');
    }
    if (sonuc === 'zaten_var') {
        throw kullaniciHatasi('Bu menüyü zaten değerlendirdiniz.');
    }
    console.log(`[degerlendirme] kullanici=${kullaniciId} menu=${menuId} puan=${puan}`);
    return { menu_id: menuId, puan, yorum: temizYorum || null };
}

module.exports = { listele, ekle };
