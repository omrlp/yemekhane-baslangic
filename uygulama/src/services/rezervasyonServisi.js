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

module.exports = { yap };
