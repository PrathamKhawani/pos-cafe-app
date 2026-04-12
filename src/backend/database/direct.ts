import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

export const dbDirect = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a raw SQL query with parameters.
 */
export async function queryCustom(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await dbDirect.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (err) {
    console.error('Database query error', err);
    throw err;
  }
}
