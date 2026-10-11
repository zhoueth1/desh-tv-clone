import { loadEnvConfig } from '@next/env';
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import { categoryList } from '../src/constants';
import { migrationDatabaseUrl } from '../src/keystone/database';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

async function main() {
  const connectionString = migrationDatabaseUrl();
  if (!connectionString) throw new Error('DATABASE_URL is missing.');
  const apply = process.argv.includes('--apply');
  const sql = await readFile('migrations/0001_initial/migration.sql', 'utf8');
  if (/\b(DROP|TRUNCATE|DELETE)\b/i.test(sql)) throw new Error('Setup SQL must only create the project schema.');
  const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS "([^"]+)" \(([\s\S]*?)\n\);/g)].map(match => ({
    name: match[1],
    columns: [...match[2].matchAll(/^\s+"([^"]+)"\s+(\w+)([^\n]*)/gm)].map(column => ({
      name: column[1], type: column[2], required: /\bNOT NULL\b/.test(column[3]),
    })),
  }));
  const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const existing = await client.query('select table_name, column_name, udt_name, is_nullable from information_schema.columns where table_schema = $1', ['public']);
    const types = { SERIAL: 'int4', INTEGER: 'int4', TEXT: 'text', VARCHAR: 'varchar', TIMESTAMP: 'timestamp', JSONB: 'jsonb' };
    for (const table of tables) {
      const columns = existing.rows.filter(row => row.table_name === table.name);
      if (!columns.length) continue;
      for (const expected of table.columns) {
        const actual = columns.find(column => column.column_name === expected.name);
        if (!actual || actual.udt_name !== types[expected.type] || (actual.is_nullable === 'NO') !== expected.required) {
          throw new Error(`Existing ${table.name}.${expected.name} does not match the project schema; setup stopped without changing data.`);
        }
      }
    }
    const missing = tables.filter(table => !existing.rows.some(row => row.table_name === table.name)).map(table => table.name);
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', createMissingTables: missing, enableRowLevelSecurity: tables.map(table => table.name), seedCategories: categoryList.length }));
    if (!apply) {
      console.log('Preview only. Run npm run db:initialize to initialize the schema and categories.');
      return;
    }
    await client.query('BEGIN');
    try {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['desh-tv-database-setup']);
      await client.query(sql);
      let added = 0;
      for (const name of categoryList) {
        const result = await client.query('INSERT INTO "Category" ("name", "slug") SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = $2)', [name, `/${name}`]);
        added += result.rowCount || 0;
      }
      await client.query('COMMIT');
      const verified = await client.query('SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = $1 AND tablename = ANY($2::text[]) ORDER BY tablename', ['public', tables.map(table => table.name)]);
      console.log(JSON.stringify({ initialized: true, addedCategories: added, verifiedTables: verified.rows }));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch(error => {
  let message = String(error.message);
  for (const secret of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    if (secret) message = message.replaceAll(secret, '[redacted]');
  }
  console.error(`Database setup failed: ${message}`);
  process.exitCode = 1;
});
