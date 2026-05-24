const { test } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'testuser',
  password: process.env.PGPASSWORD || 'testpass',
  database: process.env.PGDATABASE || 'testdb',
  port: 5432,
});

test('INSERT i SELECT produktu z bazy', async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0
  )`);

  await pool.query(
    'INSERT INTO products (name, price) VALUES ($1, $2)',
    ['TestProduct', 9.99]
  );

  const result = await pool.query(
    'SELECT * FROM products WHERE name = $1',
    ['TestProduct']
  );

  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.rows[0].name, 'TestProduct');
  assert.strictEqual(parseFloat(result.rows[0].price), 9.99);

  await pool.end();
});