//genel olaral tum okumaları replıkadan yapıyorum
const db = require('../db');

async function yemekhaneleriListele() {
    const [satirlar] = await db.replica.execute(
        'SELECT id, ad, konum FROM yemekhaneler ORDER BY id'
    );
    return satirlar;
}

async function ogunleriListele() {
    const [satirlar] = await db.replica.execute(
        'SELECT id, ad FROM ogunler ORDER BY sira'
    );
    return satirlar;
}

async function menuSatirlari(yemekhaneId, tarih, ogunId) {
    const [satirlar] = await db.replica.execute(
        `SELECT menu_id, tarih, yemekhane_id, yemekhane, ogun_id, ogun,
                ogrenci_fiyati, personel_fiyati,
                yemek_id, yemek, kategori, kalori, vejetaryen, alerjenler
           FROM v_menu_detay
          WHERE yemekhane_id = ? AND tarih = ? AND ogun_id = ?
          ORDER BY kategori_sira, yemek`,
        [yemekhaneId, tarih, ogunId]
    );
    return satirlar;
}

async function haftalikMenuler(yemekhaneId) {
    const [satirlar] = await db.replica.execute(
        `SELECT menu_id, tarih, yemekhane_id, yemekhane, ogun_id, ogun,
                ogrenci_fiyati, personel_fiyati, rezervasyon_son,
                (rezervasyon_son > NOW()) AS acik,
                GROUP_CONCAT(yemek ORDER BY kategori_sira, yemek SEPARATOR ', ') AS yemekler
           FROM v_menu_detay
          WHERE yemekhane_id = ?
            AND tarih BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
          GROUP BY menu_id, tarih, yemekhane_id, yemekhane, ogun_id, ogun,
                   ogrenci_fiyati, personel_fiyati, rezervasyon_son
          ORDER BY tarih, ogun_id`,
        [yemekhaneId]
    );
    return satirlar;
}

async function dolulukGetir(menuIdleri) {
    if (menuIdleri.length === 0) return [];
    const [satirlar] = await db.replica.query(
        'SELECT menu_id, kapasite, rezerve, bos_yer FROM v_menu_doluluk WHERE menu_id IN (?)',
        [menuIdleri]
    );
    return satirlar;
}

async function kullanicininRezervasyonlari(kullaniciId, menuIdleri) {
    if (menuIdleri.length === 0) return [];
    const [satirlar] = await db.replica.query(
        `SELECT menu_id FROM rezervasyonlar
          WHERE kullanici_id = ? AND durum IN ('aktif', 'kullanildi') AND menu_id IN (?)`,
        [kullaniciId, menuIdleri]
    );
    return satirlar;
}

module.exports = { yemekhaneleriListele, ogunleriListele, menuSatirlari, haftalikMenuler, dolulukGetir, kullanicininRezervasyonlari };
