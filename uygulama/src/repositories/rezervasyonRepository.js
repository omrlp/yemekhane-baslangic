const db = require('../db');

async function yap(kullaniciId, menuId) {
    try {
        const [sonuc] = await db.primary.query('CALL sp_rezervasyon_yap(?, ?)', [kullaniciId, menuId]);
        return Array.isArray(sonuc[0]) ? sonuc[0][0] : sonuc[0];
    } catch (hata) {
        // 1644 Türkce hata mesajı yollucak
        if (hata.errno === 1644) {
            const kullaniciHatasi = new Error(hata.sqlMessage);
            kullaniciHatasi.kullaniciHatasi = true;
            throw kullaniciHatasi;
        }
        throw hata;
    }
}

async function bosYerKaynaktan(menuId) {
    const [satirlar] = await db.primary.execute(
        'SELECT bos_yer FROM v_menu_doluluk WHERE menu_id = ?',
        [menuId]
    );
    return satirlar[0] ? Number(satirlar[0].bos_yer) : null;
}

module.exports = { yap, bosYerKaynaktan };
