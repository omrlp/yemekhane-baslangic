const liste = document.getElementById('menuListesi');
const bildirim = document.getElementById('bildirim');
let menuler = [];

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.hidden = false;
}

function tarihYaz(tarih) {
    const [y, a, g] = tarih.split('-');
    return `${g}.${a}.${y}`;
}

function yildizYaz(puan) {
    return '★'.repeat(puan) + '☆'.repeat(5 - puan);
}

function ortalamaYaz(menu) {
    if (menu.ortalama_puan === null) return 'Henüz oy yok';
    const ort = menu.ortalama_puan.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    return `Menü ortalaması: ${ort} (${menu.oy_sayisi} oy)`;
}

function formOlustur(menu) {
    const form = document.createElement('form');
    form.className = 'degerlendirme-formu';

    const puanAlani = document.createElement('div');
    const puanEtiket = document.createElement('label');
    const puanSecim = document.createElement('select');
    const puanId = `puan-${menu.menu_id}`;
    puanEtiket.htmlFor = puanId;
    puanEtiket.textContent = 'Puan';
    puanSecim.id = puanId;
    const ilk = document.createElement('option');
    ilk.value = '';
    ilk.textContent = 'Puan seçin';
    puanSecim.appendChild(ilk);
    for (let p = 5; p >= 1; p--) {
        const secenek = document.createElement('option');
        secenek.value = p;
        secenek.textContent = `${yildizYaz(p)} (${p})`;
        puanSecim.appendChild(secenek);
    }
    puanAlani.append(puanEtiket, puanSecim);

    const yorumAlani = document.createElement('div');
    const yorumEtiket = document.createElement('label');
    const yorumKutusu = document.createElement('textarea');
    const yorumId = `yorum-${menu.menu_id}`;
    yorumEtiket.htmlFor = yorumId;
    yorumEtiket.textContent = 'Yorum (isteğe bağlı)';
    yorumKutusu.id = yorumId;
    yorumKutusu.rows = 2;
    yorumKutusu.maxLength = 500;
    yorumAlani.append(yorumEtiket, yorumKutusu);

    const gonder = document.createElement('button');
    gonder.type = 'submit';
    gonder.className = 'dugme';
    gonder.textContent = 'Gönder';

    form.append(puanAlani, yorumAlani, gonder);

    form.addEventListener('submit', async (olay) => {
        olay.preventDefault();
        if (!puanSecim.value) {
            bildirimGoster('Lütfen bir puan seçin.', false);
            return;
        }
        gonder.disabled = true;
        try {
            const sonuc = await apiIstek('/degerlendirme', {
                method: 'POST',
                body: JSON.stringify({
                    menu_id: menu.menu_id,
                    puan: Number(puanSecim.value),
                    yorum: yorumKutusu.value
                })
            });
            menu.puan = sonuc.puan;
            menu.yorum = sonuc.yorum;
            listeyiCiz();
            bildirimGoster('Değerlendirmeniz kaydedildi. Teşekkürler!', true);
        } catch (e) {
            if (e.durum === 401) { window.location.href = '/index.html'; return; }
            bildirimGoster(e.message, false);
            gonder.disabled = false;
        }
    });
    return form;
}

function satirOlustur(menu) {
    const satir = document.createElement('li');
    satir.className = 'rez-satiri';

    const ust = document.createElement('div');
    ust.className = 'menu-karti-ust';
    const baslik = document.createElement('strong');
    baslik.textContent = `${tarihYaz(menu.tarih)} · ${menu.ogun}`;
    const yemekhane = document.createElement('span');
    yemekhane.className = 'yemek-alt';
    yemekhane.textContent = menu.yemekhane;
    ust.append(baslik, yemekhane);

    const ortalama = document.createElement('div');
    ortalama.className = 'yemek-alt';
    ortalama.textContent = ortalamaYaz(menu);
    satir.append(ust, ortalama);

    if (menu.puan !== null) {
        const puan = document.createElement('div');
        puan.className = 'verilen-puan';
        puan.textContent = `Puanınız: ${yildizYaz(menu.puan)} (${menu.puan}/5)`;
        satir.appendChild(puan);
        if (menu.yorum) {
            const yorum = document.createElement('p');
            yorum.className = 'yemek-alt';
            yorum.textContent = `“${menu.yorum}”`;
            satir.appendChild(yorum);
        }
    } else {
        satir.appendChild(formOlustur(menu));
    }
    return satir;
}

function listeyiCiz() {
    liste.replaceChildren();
    if (menuler.length === 0) {
        const bos = document.createElement('li');
        bos.className = 'yemek-alt';
        bos.textContent = 'Henüz kullandığınız bir menü yok. Turnikeden geçtiğiniz menüler burada görünür.';
        liste.appendChild(bos);
        return;
    }
    for (const menu of menuler) liste.appendChild(satirOlustur(menu));
}

async function baslat() {
    try {
        const sonuc = await apiIstek('/degerlendirmelerim');
        menuler = sonuc.menuler;
        listeyiCiz();
    } catch (e) {
        if (e.durum === 401) { window.location.href = '/index.html'; return; }
        bildirimGoster(e.message, false);
    }
}

baslat();
