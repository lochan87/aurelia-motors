import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { z } from 'zod';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, '../../../..');

// The repository keeps a single .env at its root. dotenv never overrides
// variables that are already present, so test and deployment environments win.
dotenv.config({ path: path.join(repositoryRoot, '.env'), quiet: true });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().trim().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: z.string().trim().min(1).default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .trim()
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string',
    ),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `- ${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsedEnvironment.data;

export const allowedOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
