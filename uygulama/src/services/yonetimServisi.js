//kurallarımız var zaten raporda da bahsettım
const yonetimRepository = require('../repositories/yonetimRepository');
const menuServisi = require('./menuServisi');

function hata(mesaj, durum = 422) {
    const e = new Error(mesaj);
    e.kullaniciHatasi = true;
    e.durum = durum;
    return e;
}

function pozitifTamSayi(deger) {
    const n = Number(deger);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function fiyatOku(deger, ad) {
    const metin = String(deger === undefined || deger === null ? '' : deger).trim().replace(',', '.');
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(metin)) {
        throw hata(`${ad} geçerli bir tutar olmalıdır.`);
    }
    return Number(metin);
}

function yemekIdleriOku(deger) {
    if (!Array.isArray(deger)) throw hata('En az bir yemek seçin.');
    const idler = [...new Set(deger.map(pozitifTamSayi))];
    if (idler.length === 0 || idler.includes(null)) throw hata('En az bir yemek seçin.');
    return idler;
}

function tarihOku(deger) {
    const metin = String(deger || '');
    const d = new Date(`${metin}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metin) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== metin) {
        throw hata('Geçerli bir tarih girin.');
    }
    return metin;
}

function veritabaniHatasiniCevir(h) {
    if (h.errno === 1062) return hata('Bu yemekhane, tarih ve öğün için zaten bir menü var.');
    if (h.errno === 1452) return hata('Seçilen yemekhane, öğün veya yemeklerden biri bulunamadı.');
    return h;
}

const satirNesnesi = (s) => ({
    menu_id: s.menu_id,
    tarih: s.tarih,
    yemekhane_id: s.yemekhane_id,
    yemekhane: s.yemekhane,
    ogun_id: s.ogun_id,
    ogun: s.ogun,
    kapasite: Number(s.kapasite),
    rezerve: Number(s.rezerve),
    bos_yer: Number(s.bos_yer),
    doluluk_yuzde: Number(s.doluluk_yuzde),
    ogrenci_fiyati: Number(s.ogrenci_fiyati),
    personel_fiyati: Number(s.personel_fiyati),
    oy_sayisi: Number(s.oy_sayisi || 0),
    ortalama_puan: s.ortalama_puan === null ? null : Number(s.ortalama_puan),
    duzenlenebilir: Boolean(Number(s.duzenlenebilir))
});

async function yemekleriListele() {
    const satirlar = await yonetimRepository.yemekleriListele();
    return satirlar.map((y) => ({
        id: y.id, ad: y.ad, kalori: y.kalori, vejetaryen: Boolean(y.vejetaryen),
        kategori_id: y.kategori_id, kategori: y.kategori
    }));
}

async function menuleriListele(yemekhaneId) {
    const satirlar = await yonetimRepository.menuleriListele(yemekhaneId);
    return satirlar.map(satirNesnesi);
}

//guncel hali kaynaktan okunuyor yıne
async function menuDetay(menuId) {
    const satir = await yonetimRepository.menuSatiriKaynaktan(menuId);
    if (!satir) throw hata('Menü bulunamadı.', 404);
    const yemekIdleri = await yonetimRepository.menuYemekIdleriKaynaktan(menuId);
    return { menu: satirNesnesi(satir), yemek_idleri: yemekIdleri };
}

async function olustur(girdi) {
    const veri = {
        yemekhane_id: pozitifTamSayi(girdi.yemekhane_id),
        ogun_id: pozitifTamSayi(girdi.ogun_id),
        tarih: tarihOku(girdi.tarih),
        ogrenci_fiyati: fiyatOku(girdi.ogrenci_fiyati, 'Öğrenci fiyatı'),
        personel_fiyati: fiyatOku(girdi.personel_fiyati, 'Personel fiyatı'),
        yemek_idleri: yemekIdleriOku(girdi.yemek_idleri)
    };
    if (!veri.yemekhane_id || !veri.ogun_id) throw hata('Yemekhane ve öğün seçin.');
    if (await yonetimRepository.tarihGecmisMi(veri.tarih)) {
        throw hata('Geçmiş tarihli menü oluşturulamaz.');
    }

    let menuId;
    try {
        menuId = await yonetimRepository.olustur(veri);
    } catch (h) {
        throw veritabaniHatasiniCevir(h);
    }
    await menuServisi.onbellekTemizle(veri.yemekhane_id, veri.tarih, veri.ogun_id);
    console.log(`[yonetim] menü oluşturuldu: menu=${menuId}`);
    return { menu: satirNesnesi(await yonetimRepository.menuSatiriKaynaktan(menuId)) };
}

async function guncelle(menuId, girdi) {
    const veri = {
        ogrenci_fiyati: fiyatOku(girdi.ogrenci_fiyati, 'Öğrenci fiyatı'),
        personel_fiyati: fiyatOku(girdi.personel_fiyati, 'Personel fiyatı'),
        yemek_idleri: yemekIdleriOku(girdi.yemek_idleri)
    };
    const kimlik = await yonetimRepository.menuKimligiKaynaktan(menuId);
    if (!kimlik) throw hata('Menü bulunamadı.', 404);
    if (!Number(kimlik.duzenlenebilir)) throw hata('Geçmiş tarihli menü değiştirilemez.');

    try {
        await yonetimRepository.guncelle(menuId, veri);
    } catch (h) {
        throw veritabaniHatasiniCevir(h);
    }
    
    await menuServisi.onbellekTemizle(kimlik.yemekhane_id, kimlik.tarih, kimlik.ogun_id);
    console.log(`[yonetim] menü güncellendi: menu=${menuId}`);
    return { menu: satirNesnesi(await yonetimRepository.menuSatiriKaynaktan(menuId)) };
}

module.exports = { yemekleriListele, menuleriListele, menuDetay, olustur, guncelle };
