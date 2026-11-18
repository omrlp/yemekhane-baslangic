const mysql = require('mysql2/promise');

// Ana sunucu yazmaıslemlerım ıcın
const poolPrimary = mysql.createPool({
    host: process.env.DB_YAZMA_HOST || 'mysql-primary',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_KULLANICI || 'yemekhane_app',
    password: process.env.DB_SIFRE || 'Uyg_2026',
    database: process.env.DB_ADI || 'yemekhane',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kopya suncu okuma ıslerımız ıcın
const poolReplica = mysql.createPool({
    host: process.env.DB_OKUMA_HOST || 'mysql-replica',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_KULLANICI || 'yemekhane_app',
    password: process.env.DB_SIFRE || 'Uyg_2026',
    database: process.env.DB_ADI || 'yemekhane',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    primary: poolPrimary,
    replica: poolReplica
};