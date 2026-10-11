import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';
import { migrationDatabaseUrl } from './src/keystone/database';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

export default defineConfig({
  schema: 'schema.prisma',
  migrations: { path: 'migrations' },
  datasource: { url: migrationDatabaseUrl() },
});
