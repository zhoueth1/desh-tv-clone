const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');

loadEnvConfig(process.cwd());

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is missing.');
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const info = await client.query('select current_database() as database, current_user as role');
    const tables = await client.query('select tablename, rowsecurity from pg_tables where schemaname = $1 order by tablename', ['public']);
    console.log(JSON.stringify({ connection: 'ok', ...info.rows[0], tables: tables.rows }));
  } finally {
    await client.end();
  }
}

main().catch(error => {
  const message = String(error.message).replaceAll(process.env.DATABASE_URL || '__no_url__', '[redacted]');
  console.error(JSON.stringify({ connection: 'failed', code: error.code, message }));
  process.exitCode = 1;
});
