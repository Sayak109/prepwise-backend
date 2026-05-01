import 'dotenv/config';
import { defineConfig } from 'prisma/config';

process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
  /\$\{([^}]+)\}/g,
  (_, name: string) => process.env[name] ?? '',
);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node src/seed/topic-question-bank.seed.ts',
  },
});
