const bakiyeRepository = require('../repositories/bakiyeRepository');

const hareketNesnesi = (h) => ({
    id: h.id,
    tur: h.tur,
    tutar: Number(h.tutar),
    aciklama: h.aciklama,
    olusturma: h.olusturma
});

async function ozetGetir(kullaniciId) {
    const [bakiye, hareketler] = await Promise.all([
        bakiyeRepository.bakiyeKaynaktan(kullaniciId),
        bakiyeRepository.hareketleriListele(kullaniciId)
    ]);
    return { bakiye, hareketler: hareketler.map(hareketNesnesi) };
}

async function yukle(kullaniciId, tutar) {
    const sonuc = await bakiyeRepository.yukle(kullaniciId, tutar);
    const hareket = await bakiyeRepository.hareketKaynaktan(sonuc.hareket_id);
    console.log(`[bakiye] yükleme: kullanici=${kullaniciId} tutar=${tutar} hareket=${sonuc.hareket_id} (bakiye kaynaktan okundu)`);
    return {
        bakiye: Number(sonuc.bakiye),
        hareket: hareket ? hareketNesnesi(hareket) : null
    };
}

module.exports = { ozetGetir, yukle };
