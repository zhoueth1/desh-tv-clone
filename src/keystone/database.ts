import type { PoolConfig } from 'pg';

export function databasePoolConfig(): PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  };
}

function supabaseProject(url: URL) {
  if (url.hostname.endsWith('.pooler.supabase.com')) {
    return decodeURIComponent(url.username).split('.').at(-1);
  }
  if (url.hostname.startsWith('db.') && url.hostname.endsWith('.supabase.co')) {
    return url.hostname.split('.')[1];
  }
  return undefined;
}

export function migrationDatabaseUrl() {
  const runtime = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;
  if (!direct || !runtime) return runtime || direct;
  const runtimeProject = supabaseProject(new URL(runtime));
  const directProject = supabaseProject(new URL(direct));
  if ((runtimeProject || directProject) && runtimeProject !== directProject) {
    console.warn('DIRECT_URL refers to a different database project; using DATABASE_URL.');
    return runtime;
  }
  return direct;
}
