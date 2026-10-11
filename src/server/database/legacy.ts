import { Client } from 'pg';
import mysql from 'mysql2/promise';

export async function readLegacyRows(table: 'categories' | 'recommended_articles') {
  const connectionString = process.env.OLD_DATABASE_URL;
  if (!connectionString) throw new Error('OLD_DATABASE_URL must be configured to transfer legacy data.');
  const url = new URL(connectionString);
  if (url.protocol === 'mysql:') {
    const connection = await mysql.createConnection(connectionString);
    try {
      const [rows] = await connection.query(`SELECT * FROM ${table}`);
      return rows as any[];
    } finally {
      await connection.end();
    }
  }
  if (url.protocol === 'postgres:' || url.protocol === 'postgresql:') {
    const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      const { rows } = await client.query(`SELECT * FROM ${table}`);
      return rows;
    } finally {
      await client.end();
    }
  }
  throw new Error('OLD_DATABASE_URL must be a MySQL or PostgreSQL URL.');
}
