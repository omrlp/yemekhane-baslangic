// Tek bir Redis ıstemcısını tum uygulama genelinde paylasacagız
const { createClient } = require('redis');

const istemci = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

istemci.on('error', (hata) => console.error('[redis] hata:', hata.message));

module.exports = istemci;
