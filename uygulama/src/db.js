// Veritabanı bağlantılarını burada yapacagız
const mysql = require('mysql2/promise');

function havuzOlustur(host) {
    return mysql.createPool({
        host,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_KULLANICI || 'yemekhane_app',
        password: process.env.DB_SIFRE || 'Uyg_2026',
        database: process.env.DB_ADI || 'yemekhane',
        charset: 'UTF8MB4_GENERAL_CI',
        timezone: '+03:00',
        dateStrings: true,          // tarihler JS Date cevrılmıcek  olduğu gibi gelır
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

module.exports = {
    primary: havuzOlustur(process.env.DB_YAZMA_HOST || 'mysql-primary'),
    replica: havuzOlustur(process.env.DB_OKUMA_HOST || 'mysql-replica')
};
