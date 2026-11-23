// onbellek anahtarım: menu:{yemekhane_id}:{tarih}:{ogun_id}
const redis = require('../redis');
const menuRepository = require('../repositories/menuRepository');
const profilRepository = require('../repositories/profilRepository');

const MENU_SURUMU = 2;

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

const alerjenIdleriOku = (metin) => (metin ? metin.split(',').map(Number) : []);

function uyariAlerjenleri(yemekAlerjenIdleri, kullaniciAlerjenleri) {
    return kullaniciAlerjenleri
        .filter((a) => yemekAlerjenIdleri.includes(a.id))
        .map((a) => a.ad);
}

function menuNesnesiKur(satirlar) {
    const ilk = satirlar[0];
    const yemekler = satirlar.map((s) => ({
        id: s.yemek_id,
        ad: s.yemek,
        kategori: s.kategori,
        kalori: s.kalori,
        vejetaryen: Boolean(s.vejetaryen),
        alerjenler: s.alerjenler ? s.alerjenler.split(', ') : [],
        alerjen_idleri: alerjenIdleriOku(s.alerjen_idler)
    }));
    return {
        surum: MENU_SURUMU,
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


async function gunlukMenuGetir(yemekhaneId, ogunId, kullanici) {
    const tarih = bugun();
    const key = anahtar(yemekhaneId, tarih, ogunId);

    let menu = null;
    const onbellek = await redis.get(key);
    if (onbellek) {
        const aday = JSON.parse(onbellek);
        if (aday.surum === MENU_SURUMU) {
            menu = aday;
            console.log(`[menu] ${key} Redis'ten geldi`);
        } else {
            console.log(`[menu] ${key} eski yapıda, yok sayıldı`);
        }
    }
    if (!menu) {
        const satirlar = await menuRepository.menuSatirlari(yemekhaneId, tarih, ogunId);
        if (satirlar.length === 0) return null;
        menu = menuNesnesiKur(satirlar);
        await redis.set(key, JSON.stringify(menu), { EX: gunSonunaKalanSaniye() });
        console.log(`[menu] ${key} veritabanından okundu, Redis'e yazıldı`);
    }

    
    const alerjenlerim = await profilRepository.kullaniciAlerjenleri(kullanici.id);
    const { ogrenci_fiyati, personel_fiyati, surum, ...genel } = menu;
    return {
        ...genel,
        fiyat: fiyatSec(kullanici.rol, ogrenci_fiyati, personel_fiyati),
        yemekler: menu.yemekler.map(({ alerjen_idleri, ...yemek }) => ({
            ...yemek,
            uyari_alerjenler: uyariAlerjenleri(alerjen_idleri, alerjenlerim)
        }))
    };
}

async function haftalikMenuGetir(yemekhaneId, kullanici) {
    const rol = kullanici.rol;
    const menuler = await menuRepository.haftalikMenuler(yemekhaneId);
    const menuIdleri = menuler.map((m) => m.menu_id);
    const [doluluk, rezervasyonlar, alerjenlerim] = await Promise.all([
        menuRepository.dolulukGetir(menuIdleri),
        menuRepository.kullanicininRezervasyonlari(kullanici.id, menuIdleri),
        profilRepository.kullaniciAlerjenleri(kullanici.id)
    ]);
    const dolulukHaritasi = new Map(doluluk.map((d) => [d.menu_id, d]));
    const rezerveEdilenler = new Set(rezervasyonlar.map((r) => r.menu_id));

    
    const uyarilar = new Map();
    if (alerjenlerim.length > 0) {
        const satirlar = await menuRepository.haftalikAlerjenliYemekler(yemekhaneId);
        for (const s of satirlar) {
            const eslesen = uyariAlerjenleri(alerjenIdleriOku(s.alerjen_idler), alerjenlerim);
            if (eslesen.length === 0) continue;
            if (!uyarilar.has(s.menu_id)) uyarilar.set(s.menu_id, []);
            uyarilar.get(s.menu_id).push({ yemek: s.yemek, alerjenler: eslesen });
        }
    }

    return menuler.map((m) => {
        const d = dolulukHaritasi.get(m.menu_id);
        const yarimFiyat = rol === 'ogrenci' ? m.ogrenci_yarim_fiyati : m.personel_yarim_fiyati;
        return {
            menu_id: m.menu_id,
            tarih: m.tarih,
            yemekhane: m.yemekhane,
            ogun_id: m.ogun_id,
            ogun: m.ogun,
            yemekler: m.yemekler,
            fiyat: fiyatSec(rol, m.ogrenci_fiyati, m.personel_fiyati),
            yarim_fiyat: yarimFiyat === null ? null : Number(yarimFiyat),
            rezervasyon_son: m.rezervasyon_son,
            acik: Boolean(Number(m.acik)),
            rezerve: rezerveEdilenler.has(m.menu_id),
            uyarilar: uyarilar.get(m.menu_id) || [],
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

//eski ve yenı kayıtların ayrımı ıcın
async function eskiKayitlariTemizle() {
    let silinen = 0;
    for await (const bulunan of redis.scanIterator({ MATCH: 'menu:*', COUNT: 100 })) {
        const anahtarlar = Array.isArray(bulunan) ? bulunan : [bulunan];
        for (const key of anahtarlar) {
            let eski = true;
            try {
                const deger = await redis.get(key);
                eski = !deger || JSON.parse(deger).surum !== MENU_SURUMU;
            } catch (hata) {
                eski = true; //okunamayn eskıdır anlamında
            }
            if (eski) {
                await redis.del(key);
                silinen += 1;
                console.log(`[menu] ${key} eski yapıda, silindi`);
            }
        }
    }
    console.log(`[menu] başlangıç temizliği: ${silinen} eski yapıdaki menü kaydı silindi`);
}

module.exports = {
    referansGetir, gunlukMenuGetir, haftalikMenuGetir,
    onbellekTemizle, eskiKayitlariTemizle, menuNesnesiKur
};
