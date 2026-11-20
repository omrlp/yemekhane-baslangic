// onbellek anahtarım: menu:{yemekhane_id}:{tarih}:{ogun_id}
const redis = require('../redis');
const menuRepository = require('../repositories/menuRepository');

const anahtar = (yemekhaneId, tarih, ogunId) => `menu:${yemekhaneId}:${tarih}:${ogunId}`;

function bugun() {
    const d = new Date();
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const gun = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${ay}-${gun}`;
}

function gunSonunaKalanSaniye() {
    const simdi = new Date();
    const yarin = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + 1);
    return Math.max(60, Math.ceil((yarin - simdi) / 1000));
}

function menuNesnesiKur(satirlar) {
    const ilk = satirlar[0];
    const yemekler = satirlar.map((s) => ({
        id: s.yemek_id,
        ad: s.yemek,
        kategori: s.kategori,
        kalori: s.kalori,
        vejetaryen: Boolean(s.vejetaryen),
        alerjenler: s.alerjenler ? s.alerjenler.split(', ') : []
    }));
    return {
        menu_id: ilk.menu_id,
        tarih: ilk.tarih,
        yemekhane_id: ilk.yemekhane_id,
        yemekhane: ilk.yemekhane,
        ogun_id: ilk.ogun_id,
        ogun: ilk.ogun,
        ogrenci_fiyati: Number(ilk.ogrenci_fiyati),
        personel_fiyati: Number(ilk.personel_fiyati),
        toplam_kalori: yemekler.reduce((toplam, y) => toplam + y.kalori, 0),
        yemekler
    };
}

// Fiyat kullanıcının rolune gore secılmıs olucak.
const fiyatSec = (rol, ogrenciFiyati, personelFiyati) =>
    rol === 'ogrenci' ? Number(ogrenciFiyati) : Number(personelFiyati);

async function referansGetir() {
    const [yemekhaneler, ogunler] = await Promise.all([
        menuRepository.yemekhaneleriListele(),
        menuRepository.ogunleriListele()
    ]);
    return { yemekhaneler, ogunler };
}

async function gunlukMenuGetir(yemekhaneId, ogunId, rol) {
    const tarih = bugun();
    const key = anahtar(yemekhaneId, tarih, ogunId);

    let menu;
    const onbellek = await redis.get(key);
    if (onbellek) {
        menu = JSON.parse(onbellek);
        console.log(`[menu] ${key} Redis'ten geldi`);
    } else {
        const satirlar = await menuRepository.menuSatirlari(yemekhaneId, tarih, ogunId);
        if (satirlar.length === 0) return null;
        menu = menuNesnesiKur(satirlar);
        await redis.set(key, JSON.stringify(menu), { EX: gunSonunaKalanSaniye() });
        console.log(`[menu] ${key} veritabanından okundu, Redis'e yazıldı`);
    }

    const { ogrenci_fiyati, personel_fiyati, ...genel } = menu;
    return { ...genel, fiyat: fiyatSec(rol, ogrenci_fiyati, personel_fiyati) };
}

async function haftalikMenuGetir(yemekhaneId, kullanici) {
    const rol = kullanici.rol;
    const menuler = await menuRepository.haftalikMenuler(yemekhaneId);
    const menuIdleri = menuler.map((m) => m.menu_id);
    const [doluluk, rezervasyonlar] = await Promise.all([
        menuRepository.dolulukGetir(menuIdleri),
        menuRepository.kullanicininRezervasyonlari(kullanici.id, menuIdleri)
    ]);
    const dolulukHaritasi = new Map(doluluk.map((d) => [d.menu_id, d]));
    const rezerveEdilenler = new Set(rezervasyonlar.map((r) => r.menu_id));

    return menuler.map((m) => {
        const d = dolulukHaritasi.get(m.menu_id);
        return {
            menu_id: m.menu_id,
            tarih: m.tarih,
            yemekhane: m.yemekhane,
            ogun_id: m.ogun_id,
            ogun: m.ogun,
            yemekler: m.yemekler,
            fiyat: fiyatSec(rol, m.ogrenci_fiyati, m.personel_fiyati),
            rezervasyon_son: m.rezervasyon_son,
            acik: Boolean(Number(m.acik)),
            rezerve: rezerveEdilenler.has(m.menu_id),
            kapasite: d ? Number(d.kapasite) : null,
            bos_yer: d ? Number(d.bos_yer) : null
        };
    });
}

async function onbellekTemizle(yemekhaneId, tarih, ogunId) {
    const key = anahtar(yemekhaneId, tarih, ogunId);
    await redis.del(key);
    console.log(`[menu] ${key} önbellekten silindi`);
}

module.exports = { referansGetir, gunlukMenuGetir, haftalikMenuGetir, onbellekTemizle, menuNesnesiKur };
