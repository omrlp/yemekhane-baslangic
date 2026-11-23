const db = require('../db');
const { islemYap } = require('./yordam');

async function alerjenleriListele() {
    const [satirlar] = await db.replica.execute('SELECT id, ad FROM alerjenler ORDER BY ad');
    return satirlar;
}

async function kullaniciAlerjenleri(kullaniciId) {
    const [satirlar] = await db.replica.execute(
        `SELECT a.id, a.ad
           FROM kullanici_alerjenleri ka
           JOIN alerjenler a ON a.id = ka.alerjen_id
          WHERE ka.kullanici_id = ?
          ORDER BY a.ad`,
        [kullaniciId]
    );
    return satirlar;
}

// Kaynaktan okunacak replikadan yetısmez dıye
async function kullaniciAlerjenleriKaynaktan(kullaniciId) {
    const [satirlar] = await db.primary.execute(
        `SELECT a.id, a.ad
           FROM kullanici_alerjenleri ka
           JOIN alerjenler a ON a.id = ka.alerjen_id
          WHERE ka.kullanici_id = ?
          ORDER BY a.ad`,
        [kullaniciId]
    );
    return satirlar;
}

//secım tamamen degısıcek sılip ekleyle
function alerjenleriKaydet(kullaniciId, alerjenIdleri) {
    return islemYap(async (baglanti) => {
        await baglanti.execute('DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?', [kullaniciId]);
        if (alerjenIdleri.length > 0) {
            await baglanti.query(
                'INSERT INTO kullanici_alerjenleri (kullanici_id, alerjen_id) VALUES ?',
                [alerjenIdleri.map((id) => [kullaniciId, id])]
            );
        }
    });
}

module.exports = { alerjenleriListele, kullaniciAlerjenleri, kullaniciAlerjenleriKaynaktan, alerjenleriKaydet };
