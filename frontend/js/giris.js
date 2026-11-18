const girisBolumu = document.getElementById('girisBolumu');
const oturumBolumu = document.getElementById('oturumBolumu');
const bildirim = document.getElementById('bildirim');

function hataGoster(mesaj) {
    bildirim.textContent = mesaj;
    bildirim.hidden = false;
}

function gorunumuAyarla(kullanici) {
    bildirim.hidden = true;
    if (kullanici) {
        document.getElementById('selam').textContent = `Merhaba, ${kullanici.ad} ${kullanici.soyad}`;
        document.getElementById('rolBilgi').textContent = `Rol: ${kullanici.rol}`;
        girisBolumu.hidden = true;
        oturumBolumu.hidden = false;
    } else {
        oturumBolumu.hidden = true;
        girisBolumu.hidden = false;
    }
}

async function oturumuKontrolEt() {
    try {
        const { kullanici } = await apiIstek('/ben');
        gorunumuAyarla(kullanici);
    } catch (e) {
        gorunumuAyarla(null);
    }
}

document.getElementById('girisFormu').addEventListener('submit', async (olay) => {
    olay.preventDefault();
    try {
        const { kullanici } = await apiIstek('/giris', {
            method: 'POST',
            body: JSON.stringify({
                eposta: document.getElementById('eposta').value,
                sifre: document.getElementById('sifre').value
            })
        });
        document.getElementById('sifre').value = '';
        gorunumuAyarla(kullanici);
    } catch (e) {
        hataGoster(e.message);
    }
});

document.getElementById('cikisDugmesi').addEventListener('click', async () => {
    try { await apiIstek('/cikis', { method: 'POST' }); } catch (e) { /* yoksay */ }
    gorunumuAyarla(null);
});

oturumuKontrolEt();
