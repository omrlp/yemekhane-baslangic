//alerjen secımı ıcın
const profilRepository = require('../repositories/profilRepository');

function kullaniciHatasi(mesaj) {
    const hata = new Error(mesaj);
    hata.kullaniciHatasi = true;
    return hata;
}

async function getir(kullanici) {
    const [tumu, secili] = await Promise.all([
        profilRepository.alerjenleriListele(),
        profilRepository.kullaniciAlerjenleri(kullanici.id)
    ]);
    const seciliIdler = new Set(secili.map((a) => a.id));
    return {
        kullanici,
        alerjenler: tumu.map((a) => ({ id: a.id, ad: a.ad, secili: seciliIdler.has(a.id) }))
    };
}

async function alerjenleriKaydet(kullaniciId, deger) {
    if (!Array.isArray(deger)) throw kullaniciHatasi('Alerjen listesi gereklidir.');
    const idler = [...new Set(deger.map(Number))];
    if (idler.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw kullaniciHatasi('Geçersiz alerjen seçimi.');
    }
    try {
        await profilRepository.alerjenleriKaydet(kullaniciId, idler);
    } catch (hata) {
        if (hata.errno === 1452) throw kullaniciHatasi('Seçilen alerjenlerden biri bulunamadı.');
        throw hata;
    }
    console.log(`[profil] alerjenler kaydedildi: kullanici=${kullaniciId} adet=${idler.length}`);
    return { alerjenler: await profilRepository.kullaniciAlerjenleriKaynaktan(kullaniciId) };
}

module.exports = { getir, alerjenleriKaydet };
