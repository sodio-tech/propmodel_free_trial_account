import { createClient } from 'redis';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    ttl: process.env.REDIS_CACHE_TTL || 3600 // 1 hour default TTL
};

const redisClient = createClient({
    url: `redis://${redisConfig.password ? `:${redisConfig.password}@` : ''}${redisConfig.host}:${redisConfig.port}`
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error);

const getCacheKey = (prefix, id) => `${prefix}:${id}`;

export { redisClient, redisConfig ,getCacheKey};