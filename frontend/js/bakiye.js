const bakiyeYazi = document.getElementById('bakiye');
const liste = document.getElementById('hareketListesi');
const bildirim = document.getElementById('bildirim');
const form = document.getElementById('yuklemeFormu');
const tutarKutusu = document.getElementById('tutar');

const TUR_ADI = { yukleme: 'Bakiye yükleme', rezervasyon: 'Rezervasyon', iade: 'İade' };
let hareketler = [];

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.hidden = false;
}

function paraYaz(tutar, isaretli) {
    return tutar.toLocaleString('tr-TR', {
        style: 'currency', currency: 'TRY',
        signDisplay: isaretli ? 'always' : 'auto'
    });
}

function zamanYaz(zaman) {
    const [tarih, saat] = zaman.split(' ');
    const [y, a, g] = tarih.split('-');
    return `${g}.${a}.${y} ${saat.slice(0, 5)}`;
}

function listeyiCiz() {
    liste.replaceChildren();
    if (hareketler.length === 0) {
        const bos = document.createElement('li');
        bos.className = 'yemek-alt';
        bos.textContent = 'Henüz hareket yok.';
        liste.appendChild(bos);
        return;
    }
    for (const h of hareketler) {
        const satir = document.createElement('li');
        satir.className = 'hareket-satiri';

        const sol = document.createElement('div');
        const ad = document.createElement('div');
        ad.className = 'yemek-ad';
        ad.textContent = h.aciklama || TUR_ADI[h.tur] || h.tur;
        const zaman = document.createElement('div');
        zaman.className = 'yemek-alt';
        zaman.textContent = zamanYaz(h.olusturma);
        sol.append(ad, zaman);

        const tutar = document.createElement('strong');
        tutar.className = h.tutar >= 0 ? 'tutar-artti' : 'tutar-azaldi';
        tutar.textContent = paraYaz(h.tutar, true);

        satir.append(sol, tutar);
        liste.appendChild(satir);
    }
}

async function yukle() {
    try {
        const ozet = await apiIstek('/bakiye');
        bakiyeYazi.textContent = paraYaz(ozet.bakiye);
        hareketler = ozet.hareketler;
        listeyiCiz();
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false);
    }
}

form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    bildirim.hidden = true;
    try {
        const sonuc = await apiIstek('/bakiye/yukle', {
            method: 'POST',
            body: JSON.stringify({ tutar: tutarKutusu.value })
        });
        //kaynaktan geldiği için guncellıyorum
        bakiyeYazi.textContent = paraYaz(sonuc.bakiye);
        if (sonuc.hareket) {
            hareketler.unshift(sonuc.hareket);
            listeyiCiz();
        }
        tutarKutusu.value = '';
        bildirimGoster(`Bakiye yüklendi. Yeni bakiyeniz: ${paraYaz(sonuc.bakiye)}`, true);
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false); 
    }
});

yukle();
