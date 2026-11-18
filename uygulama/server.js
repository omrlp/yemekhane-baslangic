const express = require('express');
const db = require('./db');
const app = express();
const port = 8000;

app.use(express.json());

// Veri tabanı bağlantısını test eden yer bursı olacak
app.get('/api/test', async (req, res) => {
    try {
        // Okuma işlemi olduğundan db.replica kullanıyoruum
        const [rows] = await db.replica.query('SELECT eposta, rol FROM kullanicilar LIMIT 3');
        res.json({ 
            mesaj: "Veri tabanına başarıyla bağlanıldı!",
            kullanicilar: rows
        });
    } catch (error) {
        console.error("Veri tabanı hatası:", error);
        res.status(500).json({ hata: "Veri tabanına bağlanılamadı." });
    }
});

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda dinleniyor`);
});