//yonetıcı pnaleı burda. sadece verıyı alıp gosterıyor. kurallar vs burada degıl
const yemekhaneSecim = document.getElementById('yemekhane');
const liste = document.getElementById('menuListesi');
const bildirim = document.getElementById('bildirim');
const icerik = document.getElementById('icerik');
const form = document.getElementById('menuFormu');
const fYemekhane = document.getElementById('fYemekhane');
const fOgun = document.getElementById('fOgun');
const fTarih = document.getElementById('fTarih');
const fOgrenci = document.getElementById('fOgrenci');
const fPersonel = document.getElementById('fPersonel');
const yemekSecimi = document.getElementById('yemekSecimi');

let menuler = [];
let yemekler = [];
let duzenlenen = null;

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.hidden = false;
}

function hataIsle(e) {
    if (e.durum === 401) { window.location.href = '/index.html'; return; }
    if (e.durum === 403) {
        icerik.hidden = true;
        bildirimGoster('Bu sayfa yalnızca yöneticiler içindir.', false);
        return;
    }
    bildirimGoster(e.message, false);
}

const paraYaz = (t) => t.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

function tarihYaz(tarih) { 
    const [y, a, g] = tarih.split('-');
    return `${g}.${a}.${y}`;
}

function secenekleriDoldur(secim, kayitlar) {
    secim.replaceChildren();
    for (const kayit of kayitlar) {
        const secenek = document.createElement('option');
        secenek.value = kayit.id;
        secenek.textContent = kayit.ad;
        secim.appendChild(secenek);
    }
}

//menu lıstem burda

function satirOlustur(menu) {
    const satir = document.createElement('li');
    satir.className = 'rez-satiri';

    const ust = document.createElement('div');
    ust.className = 'menu-karti-ust';
    const baslik = document.createElement('strong');
    baslik.textContent = `${tarihYaz(menu.tarih)} · ${menu.ogun}`;
    const fiyat = document.createElement('span');
    fiyat.className = 'yemek-alt';
    fiyat.textContent = `Öğrenci ${paraYaz(menu.ogrenci_fiyati)} · Personel ${paraYaz(menu.personel_fiyati)}`;
    ust.append(baslik, fiyat);

    const doluluk = document.createElement('div');
    doluluk.className = 'yemek-alt';
    const yuzde = menu.doluluk_yuzde.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    doluluk.textContent = `Doluluk: ${menu.rezerve} / ${menu.kapasite} (%${yuzde})`;

    const puan = document.createElement('div');
    puan.className = 'yemek-alt';
    puan.textContent = menu.ortalama_puan === null
        ? 'Ortalama puan: oy yok'
        : `Ortalama puan: ${menu.ortalama_puan.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} (${menu.oy_sayisi} oy)`;

    const alt = document.createElement('div');
    alt.className = 'menu-karti-alt';
    const dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'dugme dugme-ikincil';
    if (menu.duzenlenebilir) {
        dugme.textContent = 'Düzenle';
        dugme.addEventListener('click', () => duzenlemeyiAc(menu));
    } else {
        dugme.textContent = 'Geçmiş menü';
        dugme.disabled = true;
    }
    alt.appendChild(dugme);

    satir.append(ust, doluluk, puan, alt);
    return satir;
}

function listeyiCiz() {
    liste.replaceChildren();
    if (menuler.length === 0) {
        const bos = document.createElement('li');
        bos.className = 'yemek-alt';
        bos.textContent = 'Bu yemekhane için menü yok.';
        liste.appendChild(bos);
        return;
    }
    for (const menu of menuler) liste.appendChild(satirOlustur(menu));
}

async function listeyiYukle() {
    try {
        const sonuc = await apiIstek('/yonetim/menuler?yemekhane_id=' + yemekhaneSecim.value);
        menuler = sonuc.menuler;
        listeyiCiz();
    } catch (e) { hataIsle(e); }
}

//kaydedilen satır kaynaktan gelıcek
function satiriYerlestir(menu) {
    if (Number(menu.yemekhane_id) !== Number(yemekhaneSecim.value)) return;
    const indeks = menuler.findIndex((m) => m.menu_id === menu.menu_id);
    if (indeks >= 0) menuler[indeks] = menu; else menuler.push(menu);
    menuler.sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : a.ogun_id - b.ogun_id));
    listeyiCiz();
}

//kayıt ıcın form

function yemekSeciminiKur() {
    yemekSecimi.replaceChildren();
    let sonKategori = null;
    let grup = null;
    for (const yemek of yemekler) {
        if (yemek.kategori_id !== sonKategori) {
            sonKategori = yemek.kategori_id;
            grup = document.createElement('fieldset');
            const baslik = document.createElement('legend');
            baslik.textContent = yemek.kategori;
            grup.appendChild(baslik);
            yemekSecimi.appendChild(grup);
        }
        const etiket = document.createElement('label');
        etiket.className = 'yemek-secenek';
        const kutu = document.createElement('input');
        kutu.type = 'checkbox';
        kutu.value = yemek.id;
        etiket.append(kutu, ` ${yemek.ad} (${yemek.kalori} kcal)`);
        grup.appendChild(etiket);
    }
}

function secilenYemekler() {
    return [...yemekSecimi.querySelectorAll('input:checked')].map((k) => Number(k.value));
}

function formuAc(menu, yemekIdleri) {
    duzenlenen = menu;
    bildirim.hidden = true;
    document.getElementById('formBaslik').textContent = menu ? 'Menüyü düzenle' : 'Yeni menü';
    const kimlikKilitli = Boolean(menu);
    fYemekhane.disabled = fOgun.disabled = fTarih.disabled = kimlikKilitli;

    if (menu) {
        fYemekhane.value = menu.yemekhane_id;
        fOgun.value = menu.ogun_id;
        fTarih.value = menu.tarih;
        fOgrenci.value = menu.ogrenci_fiyati;
        fPersonel.value = menu.personel_fiyati;
    } else {
        fYemekhane.value = yemekhaneSecim.value;
        fTarih.value = '';
        fOgrenci.value = '';
        fPersonel.value = '';
    }
    const secili = new Set(yemekIdleri || []);
    for (const kutu of yemekSecimi.querySelectorAll('input')) {
        kutu.checked = secili.has(Number(kutu.value));
    }
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function duzenlemeyiAc(menu) {
    try {
        //guncel hal de kaynaktan okunacak
        const sonuc = await apiIstek('/yonetim/menuler/' + menu.menu_id);
        formuAc(sonuc.menu, sonuc.yemek_idleri);
    } catch (e) { hataIsle(e); }
}

form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    bildirim.hidden = true;
    const govde = {
        ogrenci_fiyati: fOgrenci.value,
        personel_fiyati: fPersonel.value,
        yemek_idleri: secilenYemekler()
    };
    try {
        let sonuc;
        if (duzenlenen) {
            sonuc = await apiIstek('/yonetim/menuler/' + duzenlenen.menu_id,
                { method: 'PUT', body: JSON.stringify(govde) });
        } else {
            sonuc = await apiIstek('/yonetim/menuler', {
                method: 'POST',
                body: JSON.stringify({
                    ...govde,
                    yemekhane_id: fYemekhane.value,
                    ogun_id: fOgun.value,
                    tarih: fTarih.value
                })
            });
        }
        satiriYerlestir(sonuc.menu);
        form.hidden = true;
        bildirimGoster(duzenlenen ? 'Menü güncellendi.' : 'Menü oluşturuldu.', true);
        duzenlenen = null;
    } catch (e) { hataIsle(e); }
});

document.getElementById('vazgec').addEventListener('click', () => {
    form.hidden = true;
    duzenlenen = null;
});
document.getElementById('yeniMenu').addEventListener('click', () => formuAc(null, []));
yemekhaneSecim.addEventListener('change', listeyiYukle);

async function baslat() {
    try {
        const [referans, yemekSonucu] = await Promise.all([
            apiIstek('/referans'),
            apiIstek('/yonetim/yemekler')
        ]);
        secenekleriDoldur(yemekhaneSecim, referans.yemekhaneler);
        secenekleriDoldur(fYemekhane, referans.yemekhaneler);
        secenekleriDoldur(fOgun, referans.ogunler);
        yemekler = yemekSonucu.yemekler;
        yemekSeciminiKur();
        await listeyiYukle();
    } catch (e) { hataIsle(e); }
}

baslat();
