import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.TURSODB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
});

export const query = (text, params) => pool.query(text, params);

