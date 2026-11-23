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
                yemek_id, yemek, kategori, kalori, vejetaryen, alerjenler, alerjen_idler
           FROM v_menu_detay
          WHERE yemekhane_id = ? AND tarih = ? AND ogun_id = ?
          ORDER BY kategori_sira, yemek`,
        [yemekhaneId, tarih, ogunId]
    );
    return satirlar;
}

async function haftalikMenuler(yemekhaneId) {
    const [satirlar] = await db.replica.execute(
        `SELECT d.menu_id, d.tarih, d.yemekhane_id, d.yemekhane, d.ogun_id, d.ogun,
                d.ogrenci_fiyati, d.personel_fiyati, d.rezervasyon_son,
                (d.rezervasyon_son > NOW()) AS acik,
                ROUND(d.ogrenci_fiyati  * og.yarim_porsiyon_orani, 2) AS ogrenci_yarim_fiyati,
                ROUND(d.personel_fiyati * og.yarim_porsiyon_orani, 2) AS personel_yarim_fiyati,
                GROUP_CONCAT(d.yemek ORDER BY d.kategori_sira, d.yemek SEPARATOR ', ') AS yemekler
           FROM v_menu_detay d
           JOIN ogunler og ON og.id = d.ogun_id
          WHERE d.yemekhane_id = ?
            AND d.tarih BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
          GROUP BY d.menu_id, d.tarih, d.yemekhane_id, d.yemekhane, d.ogun_id, d.ogun,
                   d.ogrenci_fiyati, d.personel_fiyati, d.rezervasyon_son, og.yarim_porsiyon_orani
          ORDER BY d.tarih, d.ogun_id`,
        [yemekhaneId]
    );
    return satirlar;
}


async function haftalikAlerjenliYemekler(yemekhaneId) {
    const [satirlar] = await db.replica.execute(
        `SELECT menu_id, yemek, alerjen_idler
           FROM v_menu_detay
          WHERE yemekhane_id = ?
            AND tarih BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
            AND alerjen_idler IS NOT NULL`,
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

module.exports = { yemekhaneleriListele, ogunleriListele, menuSatirlari, haftalikMenuler, haftalikAlerjenliYemekler, dolulukGetir, kullanicininRezervasyonlari };
