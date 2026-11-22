const db = require('../db');
const { yordamCagir } = require('./yordam');

// guncel parayı yıne kaynaktan okuyorum dıger bazı ogelerde oldugu gıbı.
async function bakiyeKaynaktan(kullaniciId) {
    const [satirlar] = await db.primary.execute(
        'SELECT bakiye FROM kullanicilar WHERE id = ?',
        [kullaniciId]
    );
    return satirlar[0] ? Number(satirlar[0].bakiye) : null;
}

// gecmısı ıse replikadan okuyorum sebebını raporda da acıkladım
async function hareketleriListele(kullaniciId) {
    const [satirlar] = await db.replica.execute(
        `SELECT id, tur, tutar, aciklama, olusturma
           FROM bakiye_hareketleri
          WHERE kullanici_id = ?
          ORDER BY olusturma DESC, id DESC
          LIMIT 50`,
        [kullaniciId]
    );
    return satirlar;
}

async function hareketKaynaktan(hareketId) {
    const [satirlar] = await db.primary.execute(
        'SELECT id, tur, tutar, aciklama, olusturma FROM bakiye_hareketleri WHERE id = ?',
        [hareketId]
    );
    return satirlar[0] || null;
}

const yukle = (kullaniciId, tutar) =>
    yordamCagir('CALL sp_bakiye_yukle(?, ?)', [kullaniciId, tutar]);

module.exports = { bakiyeKaynaktan, hareketleriListele, hareketKaynaktan, yukle };
