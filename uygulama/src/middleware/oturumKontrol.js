// tokenımızı Redise dogruluyor
const oturumServisi = require('../services/oturumServisi');

const CEREZ_ADI = 'oturum';

function cerezOku(req, ad) {
    const baslik = req.headers.cookie;
    if (!baslik) return null;
    for (const parca of baslik.split(';')) {
        const [k, ...v] = parca.trim().split('=');
        if (k === ad) return v.join('=');
    }
    return null;
}

function cerezAyarla(res, token) {
    res.cookie(CEREZ_ADI, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: oturumServisi.SURE_SANIYE * 1000
    });
}

async function oturumGerekli(req, res, next) {
    try {
        const token = cerezOku(req, CEREZ_ADI);
        const kullanici = await oturumServisi.getir(token);
        if (!kullanici) {
            return res.status(401).json({ hata: 'Oturum bulunamadı. Lütfen giriş yapın.' });
        }
        req.token = token;
        req.kullanici = kullanici;
        cerezAyarla(res, token); // çerezde kayar
        next();
    } catch (hata) {
        next(hata);
    }
}

function rolGerekli(...roller) {
    return (req, res, next) => {
        if (!req.kullanici || !roller.includes(req.kullanici.rol)) {
            return res.status(403).json({ hata: 'Bu işlem için yetkiniz yok.' });
        }
        next();
    };
}

module.exports = { oturumGerekli, rolGerekli, cerezOku, cerezAyarla, CEREZ_ADI };
