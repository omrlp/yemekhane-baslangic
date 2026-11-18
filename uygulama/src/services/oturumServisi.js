// Oturum yönetimi ıcın bazı ayarlar ornegın 30 dakika her istekde yenılenıyor.
const crypto = require('crypto');
const redis = require('../redis');

const SURE_SANIYE = 30 * 60;
const TOKEN_DESENI = /^[a-f0-9]{64}$/;

const anahtar = (token) => `oturum:${token}`;

async function olustur(kullanici) {
    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(anahtar(token), JSON.stringify(kullanici), { EX: SURE_SANIYE });
    return token;
}

// Oturum varsa süresini yenıkıyor ve kullanıcıyı donduuryor ama  yoksa null verıyor
async function getir(token) {
    if (!token || !TOKEN_DESENI.test(token)) return null;
    const deger = await redis.get(anahtar(token));
    if (!deger) return null;
    await redis.expire(anahtar(token), SURE_SANIYE);
    return JSON.parse(deger);
}

async function sil(token) {
    if (!token || !TOKEN_DESENI.test(token)) return;
    await redis.del(anahtar(token));
}

module.exports = { olustur, getir, sil, SURE_SANIYE };
