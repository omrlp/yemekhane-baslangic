const db = require('../db');
const { yordamCagir } = require('./yordam');

const yap = (kullaniciId, menuId, porsiyon) =>
    yordamCagir('CALL sp_rezervasyon_yap(?, ?, ?)', [kullaniciId, menuId, porsiyon]);

const iptalEt = (kullaniciId, rezervasyonId) =>
    yordamCagir('CALL sp_rezervasyon_iptal(?, ?)', [kullaniciId, rezervasyonId]);

async function bosYerKaynaktan(menuId) {
    const [satirlar] = await db.primary.execute(
        'SELECT bos_yer FROM v_menu_doluluk WHERE menu_id = ?',
        [menuId]
    );
    return satirlar[0] ? Number(satirlar[0].bos_yer) : null;
}

async function kullanicininRezervasyonlari(kullaniciId) {
    const [satirlar] = await db.replica.execute(
        `SELECT r.id, r.menu_id, r.durum, r.porsiyon, r.ucret,
                m.tarih, yh.ad AS yemekhane, o.ad AS ogun,
                TIMESTAMP(m.tarih, o.son_saat) AS rezervasyon_son,
                (r.durum = 'aktif' AND TIMESTAMP(m.tarih, o.son_saat) > NOW()) AS iptal_edilebilir
           FROM rezervasyonlar r
           JOIN menuler m       ON m.id  = r.menu_id
           JOIN ogunler o       ON o.id  = m.ogun_id
           JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
          WHERE r.kullanici_id = ?
          ORDER BY m.tarih DESC, o.sira
          LIMIT 100`,
        [kullaniciId]
    );
    return satirlar;
}

module.exports = { yap, iptalEt, bosYerKaynaktan, kullanicininRezervasyonlari };
