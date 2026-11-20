const yemekhaneSecim = document.getElementById('yemekhane');
const bildirim = document.getElementById('bildirim');
const haftaAlani = document.getElementById('haftaAlani');

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.hidden = false;
}

function paraYaz(tutar) {
    return tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

function gunBasligi(tarih) { 
    const [y, a, g] = tarih.split('-').map(Number);
    return new Date(y, a - 1, g).toLocaleDateString('tr-TR',
        { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

function saatYaz(zaman) {
    return zaman.slice(11, 16);
}

function dugmeDurumu(dugme, menu) {
    if (menu.rezerve) {
        dugme.disabled = true;
        dugme.textContent = 'Rezerve edildi';
    } else if (!menu.acik) {
        dugme.disabled = true;
        dugme.textContent = 'Süre doldu';
    } else if (menu.bos_yer === 0) {
        dugme.disabled = true;
        dugme.textContent = 'Kontenjan dolu';
    } else {
        dugme.disabled = false;
        dugme.textContent = 'Rezervasyon yap';
    }
}

function bosYerYaz(eleman, bosYer) {
    eleman.textContent = bosYer === null ? '' : `Boş yer: ${bosYer}`;
}

function kartOlustur(menu) {
    const kart = document.createElement('div');
    kart.className = 'menu-karti';

    const ust = document.createElement('div');
    ust.className = 'menu-karti-ust';
    const ogun = document.createElement('strong');
    ogun.textContent = menu.ogun;
    const fiyat = document.createElement('span');
    fiyat.className = 'fiyat';
    fiyat.textContent = paraYaz(menu.fiyat);
    ust.append(ogun, fiyat);

    const yemekler = document.createElement('p');
    yemekler.className = 'yemek-alt';
    yemekler.textContent = menu.yemekler;

    const alt = document.createElement('div');
    alt.className = 'menu-karti-alt';
    const bilgi = document.createElement('div');
    const bosYer = document.createElement('span');
    bosYer.className = 'bos-yer';
    bosYerYaz(bosYer, menu.bos_yer);
    const sonSaat = document.createElement('div');
    sonSaat.className = 'yemek-alt';
    sonSaat.textContent = `Son rezervasyon: ${saatYaz(menu.rezervasyon_son)}`;
    bilgi.append(bosYer, sonSaat);

    const dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'dugme';
    dugmeDurumu(dugme, menu);

    dugme.addEventListener('click', async () => {
        dugme.disabled = true;
        try {
            const sonuc = await apiIstek('/rezervasyon', {
                method: 'POST',
                body: JSON.stringify({ menu_id: menu.menu_id })
            });
            //replika gecıkmesı olmasn dıye kaynaktan getırdım
            if (sonuc.bos_yer !== null) bosYerYaz(bosYer, sonuc.bos_yer);
            menu.rezerve = true;
            dugmeDurumu(dugme, menu);
            bildirimGoster(
                `Rezervasyon yapıldı. Ücret: ${paraYaz(sonuc.ucret)} · Yeni bakiyeniz: ${paraYaz(sonuc.bakiye)}`,
                true
            );
        } catch (e) {
            if (e.durum === 401) { window.location.href = '/index.html'; return; }
            bildirimGoster(e.message, false); // procedure mesajı burda
            dugmeDurumu(dugme, menu);
        }
    });

    alt.append(bilgi, dugme);
    kart.append(ust, yemekler, alt);
    return kart;
}

function haftayiCiz(menuler) {
    haftaAlani.replaceChildren();
    if (menuler.length === 0) {
        bildirimGoster('Bu yemekhane için önümüzdeki 7 günde menü yok.', false);
        return;
    }
    let sonTarih = null;
    let grup = null;
    for (const menu of menuler) {
        if (menu.tarih !== sonTarih) {
            sonTarih = menu.tarih;
            grup = document.createElement('section');
            grup.className = 'gun-grubu';
            const baslik = document.createElement('h2');
            baslik.className = 'gun-baslik';
            baslik.textContent = gunBasligi(menu.tarih);
            grup.appendChild(baslik);
            haftaAlani.appendChild(grup);
        }
        grup.appendChild(kartOlustur(menu));
    }
}

async function haftayiYukle() {
    bildirim.hidden = true;
    try {
        const { menuler } = await apiIstek('/menu/haftalik?yemekhane_id=' + yemekhaneSecim.value);
        haftayiCiz(menuler);
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        haftaAlani.replaceChildren();
        bildirimGoster(e.message, false);
    }
}

async function baslat() {
    try {
        const { yemekhaneler } = await apiIstek('/referans');
        yemekhaneSecim.replaceChildren();
        for (const y of yemekhaneler) {
            const secenek = document.createElement('option');
            secenek.value = y.id;
            secenek.textContent = y.ad;
            yemekhaneSecim.appendChild(secenek);
        }
        await haftayiYukle();
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false);
    }
}

yemekhaneSecim.addEventListener('change', haftayiYukle);
baslat();
