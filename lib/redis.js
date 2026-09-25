// lib/redis.js
// חיבור משותף ל-Redis (דרך REDIS_URL) - לא KV/REST, אלא חיבור Redis רגיל.

import Redis from 'ioredis';

let client;

export function getRedis() {
  if (!client) {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing required environment variable REDIS_URL');
    }
    client = new Redis(process.env.REDIS_URL);
    client.on('error', (err) => console.error('Redis client error:', err));
  }
  return client;
}
