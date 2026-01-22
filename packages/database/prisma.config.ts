import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import path from 'path';

// Load .env from monorepo root
config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
