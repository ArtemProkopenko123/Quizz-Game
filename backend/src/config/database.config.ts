import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  name: process.env['DB_NAME'] ?? 'quizz',
  user: process.env['DB_USER'] ?? 'quizz',
  password: process.env['DB_PASSWORD'] ?? '',
}));
