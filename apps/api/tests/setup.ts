process.env.NODE_ENV = 'test';
process.env.API_HOST = '127.0.0.1';
process.env.API_PORT = '4000';
process.env.CORS_ORIGINS = 'http://localhost:5173,http://allowed.example';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://aurelia:local_dev_only@127.0.0.1:55432/aurelia_dev?schema=public';
}
