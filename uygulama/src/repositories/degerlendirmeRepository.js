const db = require('../db');

//kullanıldı fıltrelemesı yapıyoruz cunku bu bızım sartlımızdan bırı
async function kullanilanMenuler(kullaniciId) {
    const [satirlar] = await db.replica.execute(
        `SELECT r.menu_id, m.tarih, yh.ad AS yemekhane, o.ad AS ogun,
                d.puan, d.yorum,
                p.oy_sayisi, p.ortalama_puan
           FROM rezervasyonlar r
           JOIN menuler m       ON m.id  = r.menu_id
           JOIN ogunler o       ON o.id  = m.ogun_id
           JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
           LEFT JOIN degerlendirmeler d
                  ON d.menu_id = r.menu_id AND d.kullanici_id = r.kullanici_id
           LEFT JOIN v_menu_puan p ON p.menu_id = r.menu_id
          WHERE r.kullanici_id = ? AND r.durum = 'kullanildi'
          ORDER BY m.tarih DESC, o.sira
          LIMIT 100`,
        [kullaniciId]
    );
    return satirlar;
}

//burada kısı basına olan bır oyun zaten var hak yok ve eklendi gibi geri donuslerını tanımıuyoruz
async function ekle(kullaniciId, menuId, puan, yorum) {
    try {
        const [sonuc] = await db.primary.query(
            `INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum)
             SELECT ?, ?, ?, ?
               FROM rezervasyonlar
              WHERE kullanici_id = ? AND menu_id = ? AND durum = 'kullanildi'`,
            [kullaniciId, menuId, puan, yorum, kullaniciId, menuId]
        );
        return sonuc.affectedRows === 1 ? 'eklendi' : 'hak_yok';
    } catch (hata) {
        if (hata.errno === 1062) return 'zaten_var';
        throw hata;
    }
}

module.exports = { kullanilanMenuler, ekle };
