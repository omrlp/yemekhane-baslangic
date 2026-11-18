// tum sayfaların kullandıgı ortak fetch ıs kuralı yok
async function apiIstek(yol, secenekler = {}) {
    const yanit = await fetch('/api' + yol, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...secenekler
    });
    let veri = null;
    try { veri = await yanit.json(); } catch (e) { /* gövde yok */ }
    if (!yanit.ok) {
        const hata = new Error((veri && veri.hata) || 'İstek başarısız oldu.');
        hata.durum = yanit.status;
        throw hata;
    }
    return veri;
}
