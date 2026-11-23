// Günün menüsü ekranı. Yalnızca veriyi alır ve gösterir; hesaplama yapmaz.
const yemekhaneSecim = document.getElementById('yemekhane');
const ogunSecim = document.getElementById('ogun');
const bildirim = document.getElementById('bildirim');
const menuAlani = document.getElementById('menuAlani');

function secenekleriDoldur(secim, kayitlar) {
    secim.replaceChildren();
    for (const kayit of kayitlar) {
        const secenek = document.createElement('option');
        secenek.value = kayit.id;
        secenek.textContent = kayit.ad;
        secim.appendChild(secenek);
    }
}

function hataGoster(mesaj) {
    menuAlani.hidden = true;
    bildirim.textContent = mesaj;
    bildirim.hidden = false;
}

function tarihYaz(tarih) { // 2026-11-18 -> 18.11.2026
    const [y, a, g] = tarih.split('-');
    return `${g}.${a}.${y}`;
}

function paraYaz(tutar) {
    return tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

function rozetOlustur(metin, sinif) {
    const rozet = document.createElement('span');
    rozet.className = 'rozet ' + sinif;
    rozet.textContent = metin;
    return rozet;
}

function menuyuCiz(menu) {
    document.getElementById('tarihBilgi').textContent = tarihYaz(menu.tarih);
    document.getElementById('menuBaslik').textContent = `${menu.yemekhane} · ${menu.ogun}`;
    document.getElementById('menuFiyat').textContent = `Fiyatınız: ${paraYaz(menu.fiyat)}`;
    document.getElementById('toplamKalori').textContent = `${menu.toplam_kalori} kcal`;

    const liste = document.getElementById('yemekListesi');
    liste.replaceChildren();
    for (const yemek of menu.yemekler) {
        const satir = document.createElement('li');

        const ad = document.createElement('div');
        ad.className = 'yemek-ad';
        ad.textContent = yemek.ad;

        const alt = document.createElement('div');
        alt.className = 'yemek-alt';
        alt.textContent = `${yemek.kategori} · ${yemek.kalori} kcal`;

        const rozetler = document.createElement('div');
        rozetler.className = 'rozetler';
        if (yemek.vejetaryen) rozetler.appendChild(rozetOlustur('Vejetaryen', 'rozet-vej'));
        for (const alerjen of yemek.alerjenler) {
            rozetler.appendChild(rozetOlustur(alerjen, 'rozet-alerjen'));
        }

        satir.append(ad, alt, rozetler);

        //secılen alerjenler varsa uyarı gosterıleck
        const uyari = yemek.uyari_alerjenler || [];
        if (uyari.length > 0) {
            satir.classList.add('yemek-uyarili');
            const uyariKutusu = document.createElement('div');
            uyariKutusu.className = 'yemek-uyari';
            uyariKutusu.textContent = `⚠ Alerjen uyarısı: ${uyari.join(', ')}`;
            satir.appendChild(uyariKutusu);
        }
        liste.appendChild(satir);
    }

    bildirim.hidden = true;
    menuAlani.hidden = false;
}

async function menuyuYukle() {
    try {
        const sorgu = `yemekhane_id=${yemekhaneSecim.value}&ogun_id=${ogunSecim.value}`;
        const { menu } = await apiIstek('/menu/gunluk?' + sorgu);
        menuyuCiz(menu);
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        hataGoster(e.message);
    }
}

async function baslat() {
    try {
        const { yemekhaneler, ogunler } = await apiIstek('/referans');
        secenekleriDoldur(yemekhaneSecim, yemekhaneler);
        secenekleriDoldur(ogunSecim, ogunler);
        await menuyuYukle();
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        hataGoster(e.message);
    }
}

yemekhaneSecim.addEventListener('change', menuyuYukle);
ogunSecim.addEventListener('change', menuyuYukle);
baslat();
