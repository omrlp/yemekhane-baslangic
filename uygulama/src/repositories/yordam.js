// yazmalar yıne kaynaga yapılacak.
const db = require('../db');

async function yordamCagir(sql, parametreler) {
    try {
        const [sonuc] = await db.primary.query(sql, parametreler);
        return Array.isArray(sonuc[0]) ? sonuc[0][0] : sonuc[0];
    } catch (hata) {
        
        if (hata.errno === 1644) {
            const kullaniciHatasi = new Error(hata.sqlMessage);
            kullaniciHatasi.kullaniciHatasi = true;
            throw kullaniciHatasi;
        }
        throw hata; 
    }
}

module.exports = { yordamCagir };
