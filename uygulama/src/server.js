const express = require('express');
const redis = require('./redis');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const rezervasyonRoutes = require('./routes/rezervasyonRoutes');

const app = express();
const port = Number(process.env.PORT || 8000);

app.disable('x-powered-by');
app.use(express.json());

app.get('/api/saglik', (req, res) => res.json({ durum: 'ok' }));
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', rezervasyonRoutes);

app.use('/api', (req, res) => res.status(404).json({ hata: 'Böyle bir adres yok.' }));

// Beklenmeyen hatalar ıcın
app.use((hata, req, res, next) => {
    console.error('[hata]', hata);
    res.status(500).json({ hata: 'Beklenmeyen bir hata oluştu.' });
});

async function baslat() {
    await redis.connect();
    app.listen(port, () => console.log(`Uygulama ${port} portunda dinleniyor`));
}

baslat().catch((hata) => {
    console.error('Başlatılamadı:', hata);
    process.exit(1);
});
