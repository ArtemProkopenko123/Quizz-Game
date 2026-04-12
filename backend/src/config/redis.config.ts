import { registerAs } from '@nestjs/config';

/** Supports local `.env` (REDIS_*) and Railway (REDISHOST, REDISPORT, REDISPASSWORD). */
export default registerAs('redis', () => ({
  host: process.env['REDIS_HOST'] ?? process.env['REDISHOST'] ?? 'localhost',
  port: parseInt(process.env['REDIS_PORT'] ?? process.env['REDISPORT'] ?? '6379', 10),
  password: process.env['REDIS_PASSWORD'] ?? process.env['REDISPASSWORD'] ?? '',
}));
