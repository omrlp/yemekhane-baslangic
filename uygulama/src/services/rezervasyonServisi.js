//stored procedure alanı en aktıf burda kullanıyorum
const rezervasyonRepository = require('../repositories/rezervasyonRepository');

async function yap(kullaniciId, menuId) {
    // Yazma ve bakıye: kaynaktan procedure olsrak.
    const sonuc = await rezervasyonRepository.yap(kullaniciId, menuId);

    const bosYer = await rezervasyonRepository.bosYerKaynaktan(menuId);

    console.log(`[rezervasyon] kullanici=${kullaniciId} menu=${menuId} rezervasyon=${sonuc.rezervasyon_id} (bakiye ve boş yer kaynaktan okundu)`);
    return {
        rezervasyon_id: Number(sonuc.rezervasyon_id),
        ucret: Number(sonuc.ucret),
        bakiye: Number(sonuc.bakiye),
        bos_yer: bosYer
    };
}

async function listele(kullaniciId) {
    const satirlar = await rezervasyonRepository.kullanicininRezervasyonlari(kullaniciId);
    return satirlar.map((s) => ({
        id: s.id,
        menu_id: s.menu_id,
        tarih: s.tarih,
        yemekhane: s.yemekhane,
        ogun: s.ogun,
        durum: s.durum,
        ucret: Number(s.ucret),
        rezervasyon_son: s.rezervasyon_son,
        iptal_edilebilir: Boolean(Number(s.iptal_edilebilir))
    }));
}

async function iptal(kullaniciId, rezervasyonId) {
    const sonuc = await rezervasyonRepository.iptalEt(kullaniciId, rezervasyonId);
    console.log(`[rezervasyon] iptal: kullanici=${kullaniciId} rezervasyon=${rezervasyonId} (iade ve bakiye kaynaktan okundu)`);
    return {
        rezervasyon_id: Number(sonuc.rezervasyon_id),
        iade: Number(sonuc.iade),
        bakiye: Number(sonuc.bakiye)
    };
}

module.exports = { yap, listele, iptal };
