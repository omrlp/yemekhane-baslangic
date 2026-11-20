// Rezervasyonlarım ekranı yine verıyı sadece alıp gosterecek içinde ıs kuralım yıne yok
const durumSecim = document.getElementById('durumSecim');
const bildirim = document.getElementById('bildirim');
const liste = document.getElementById('rezListesi');

const DURUM_ADI = { aktif: 'Aktif', kullanildi: 'Kullanıldı', iptal: 'İptal' };
let kayitlar = [];

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.hidden = false;
}

function paraYaz(tutar) {
    return tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

function tarihYaz(tarih) { 
    const [y, a, g] = tarih.split('-');
    return `${g}.${a}.${y}`;
}

function satirOlustur(kayit) {
    const satir = document.createElement('li');
    satir.className = 'rez-satiri';

    const ust = document.createElement('div');
    ust.className = 'menu-karti-ust';
    const baslik = document.createElement('strong');
    baslik.textContent = `${tarihYaz(kayit.tarih)} · ${kayit.ogun}`;
    const rozet = document.createElement('span');
    rozet.className = 'rozet durum-' + kayit.durum;
    rozet.textContent = DURUM_ADI[kayit.durum] || kayit.durum;
    ust.append(baslik, rozet);

    const bilgi = document.createElement('div');
    bilgi.className = 'yemek-alt';
    bilgi.textContent = `${kayit.yemekhane} · ${paraYaz(kayit.ucret)}`;

    satir.append(ust, bilgi);

    if (kayit.durum === 'aktif') {
        const alt = document.createElement('div');
        alt.className = 'menu-karti-alt';
        const sonSaat = document.createElement('span');
        sonSaat.className = 'yemek-alt';
        sonSaat.textContent = `İptal için son saat: ${kayit.rezervasyon_son.slice(11, 16)}`;

        const dugme = document.createElement('button');
        dugme.type = 'button';
        dugme.className = 'dugme dugme-ikincil';
        if (kayit.iptal_edilebilir) {
            dugme.textContent = 'İptal et';
            dugme.addEventListener('click', () => iptalEt(kayit, dugme));
        } else {
            dugme.textContent = 'İptal süresi doldu';
            dugme.disabled = true;
        }
        alt.append(sonSaat, dugme);
        satir.appendChild(alt);
    }
    return satir;
}

function listeyiCiz() {
    const secili = durumSecim.value;
    const gosterilecek = kayitlar.filter((k) => secili === 'hepsi' || k.durum === secili);
    liste.replaceChildren();
    if (gosterilecek.length === 0) {
        const bos = document.createElement('li');
        bos.className = 'yemek-alt';
        bos.textContent = 'Bu durumda rezervasyon yok.';
        liste.appendChild(bos);
        return;
    }
    for (const kayit of gosterilecek) liste.appendChild(satirOlustur(kayit));
}

async function iptalEt(kayit, dugme) {
    if (!window.confirm('Bu rezervasyonu iptal etmek istiyor musunuz?')) return;
    dugme.disabled = true;
    try {
        const sonuc = await apiIstek(`/rezervasyon/${kayit.id}/iptal`, { method: 'POST' });
        // kaynaktan alıyorum yine
        kayit.durum = 'iptal';
        kayit.iptal_edilebilir = false;
        listeyiCiz();
        bildirimGoster(
            `Rezervasyon iptal edildi. İade: ${paraYaz(sonuc.iade)} · Yeni bakiyeniz: ${paraYaz(sonuc.bakiye)}`,
            true
        );
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false); // procedure mesajı yine
        dugme.disabled = false;
    }
}

async function baslat() {
    try {
        const { rezervasyonlar } = await apiIstek('/rezervasyonlarim');
        kayitlar = rezervasyonlar;
        listeyiCiz();
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false);
    }
}

durumSecim.addEventListener('change', listeyiCiz);
baslat();
