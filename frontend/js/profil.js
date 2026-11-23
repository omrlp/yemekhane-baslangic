//alerjen formları vs ıcın
const liste = document.getElementById('alerjenListesi');
const form = document.getElementById('alerjenFormu');
const bildirim = document.getElementById('bildirim');

function bildirimGoster(mesaj, basari) {
    bildirim.textContent = mesaj;
    bildirim.className = 'bildirim ' + (basari ? 'bildirim-basari' : 'bildirim-hata');
    bildirim.style.marginTop = '1rem';
    bildirim.hidden = false;
}

function hataIsle(e) {
    if (e.durum === 401) { window.location.href = '/index.html'; return; }
    bildirimGoster(e.message, false);
}

async function yukle() {
    try {
        const { kullanici, alerjenler } = await apiIstek('/profil');
        document.getElementById('kimlik').textContent =
            `${kullanici.ad} ${kullanici.soyad} · ${kullanici.eposta} · ${kullanici.rol}`;
        liste.replaceChildren();
        for (const alerjen of alerjenler) {
            const etiket = document.createElement('label');
            etiket.className = 'yemek-secenek';
            const kutu = document.createElement('input');
            kutu.type = 'checkbox';
            kutu.value = alerjen.id;
            kutu.checked = alerjen.secili;
            etiket.append(kutu, ` ${alerjen.ad}`);
            liste.appendChild(etiket);
        }
    } catch (e) { hataIsle(e); }
}

form.addEventListener('submit', async (olay) => {
    olay.preventDefault();
    bildirim.hidden = true;
    const idler = [...liste.querySelectorAll('input:checked')].map((k) => Number(k.value));
    try {
        const sonuc = await apiIstek('/profil/alerjenler', {
            method: 'PUT',
            body: JSON.stringify({ alerjen_idleri: idler })
        });
        const adlar = sonuc.alerjenler.map((a) => a.ad);
        bildirimGoster(
            adlar.length === 0 ? 'Alerjen seçiminiz temizlendi.' : `Kaydedildi: ${adlar.join(', ')}`,
            true
        );
    } catch (e) { hataIsle(e); }
});

yukle();
