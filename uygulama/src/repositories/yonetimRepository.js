const db = require('../db');
const { islemYap } = require('./yordam');

//duzenlenebılır olup olmadıgına bakıyoruz
const SATIR_SQL = `
    SELECT d.menu_id, d.tarih, d.yemekhane_id, d.yemekhane, d.ogun_id, d.ogun,
           d.kapasite, d.rezerve, d.bos_yer, d.doluluk_yuzde,
           m.ogrenci_fiyati, m.personel_fiyati,
           p.oy_sayisi, p.ortalama_puan,
           (m.tarih >= CURDATE()) AS duzenlenebilir
      FROM v_menu_doluluk d
      JOIN menuler m     ON m.id = d.menu_id
      JOIN v_menu_puan p ON p.menu_id = d.menu_id`;

async function menuleriListele(yemekhaneId) {
    const [satirlar] = await db.replica.execute(
        `${SATIR_SQL}
          WHERE d.yemekhane_id = ?
          ORDER BY d.tarih DESC, d.ogun_id
          LIMIT 60`,
        [yemekhaneId]
    );
    return satirlar;
}

//secım lıstesı ıcın
async function yemekleriListele() {
    const [satirlar] = await db.replica.execute(
        `SELECT y.id, y.ad, y.kalori, y.vejetaryen, k.id AS kategori_id, k.ad AS kategori
           FROM yemekler y
           JOIN yemek_kategorileri k ON k.id = y.kategori_id
          ORDER BY k.sira, y.ad`
    );
    return satirlar;
}

//kaynaktan okumalar burda yapılıyr

async function menuSatiriKaynaktan(menuId) {
    const [satirlar] = await db.primary.execute(`${SATIR_SQL} WHERE d.menu_id = ?`, [menuId]);
    return satirlar[0] || null;
}

async function menuYemekIdleriKaynaktan(menuId) {
    const [satirlar] = await db.primary.execute(
        'SELECT yemek_id FROM menu_yemekleri WHERE menu_id = ? ORDER BY yemek_id',
        [menuId]
    );
    return satirlar.map((s) => s.yemek_id);
}

async function menuKimligiKaynaktan(menuId) {
    const [satirlar] = await db.primary.execute(
        'SELECT yemekhane_id, tarih, ogun_id, (tarih >= CURDATE()) AS duzenlenebilir FROM menuler WHERE id = ?',
        [menuId]
    );
    return satirlar[0] || null;
}

async function tarihGecmisMi(tarih) {
    const [satirlar] = await db.primary.execute('SELECT (? < CURDATE()) AS gecmis', [tarih]);
    return Boolean(Number(satirlar[0].gecmis));
}


async function yemekleriYaz(baglanti, menuId, yemekIdleri) {
    await baglanti.query(
        'INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?',
        [yemekIdleri.map((yemekId) => [menuId, yemekId])]
    );
}

function olustur(v) {
    return islemYap(async (baglanti) => {
        const [sonuc] = await baglanti.execute(
            `INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati)
             VALUES (?, ?, ?, ?, ?)`,
            [v.yemekhane_id, v.tarih, v.ogun_id, v.ogrenci_fiyati, v.personel_fiyati]
        );
        await yemekleriYaz(baglanti, sonuc.insertId, v.yemek_idleri);
        return sonuc.insertId;
    });
}

function guncelle(menuId, v) {
    return islemYap(async (baglanti) => {
        await baglanti.execute(
            'UPDATE menuler SET ogrenci_fiyati = ?, personel_fiyati = ? WHERE id = ?',
            [v.ogrenci_fiyati, v.personel_fiyati, menuId]
        );
        await baglanti.execute('DELETE FROM menu_yemekleri WHERE menu_id = ?', [menuId]);
        await yemekleriYaz(baglanti, menuId, v.yemek_idleri);
    });
}

module.exports = {
    menuleriListele, yemekleriListele,
    menuSatiriKaynaktan, menuYemekIdleriKaynaktan, menuKimligiKaynaktan, tarihGecmisMi,
    olustur, guncelle
};
