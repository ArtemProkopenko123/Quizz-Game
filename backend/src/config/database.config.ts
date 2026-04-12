import { registerAs } from '@nestjs/config';

/** Supports local `.env` (DB_*) and Railway / managed Postgres (PG*). */
export default registerAs('database', () => ({
  host: process.env['DB_HOST'] ?? process.env['PGHOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? process.env['PGPORT'] ?? '5432', 10),
  name: process.env['DB_NAME'] ?? process.env['PGDATABASE'] ?? 'quizz',
  user: process.env['DB_USER'] ?? process.env['PGUSER'] ?? 'quizz',
  password: process.env['DB_PASSWORD'] ?? process.env['PGPASSWORD'] ?? '',
}));
