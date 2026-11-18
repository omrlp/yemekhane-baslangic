// Kullanıcı tablosuna erişen TÜM SQL burada. 
const db = require('../db');

async function epostaIleBul(eposta) {
    const [satirlar] = await db.replica.execute(
        `SELECT id, ad, soyad, eposta, sifre_hash, rol, aktif
           FROM kullanicilar
          WHERE eposta = ?
          LIMIT 1`,
        [eposta]
    );
    return satirlar[0] || null;
}

module.exports = { epostaIleBul };
