const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

let cache_hits = 0;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const redisClient = createClient({
  socket: { host: process.env.REDIS_HOST, port: 6379 },
});

redisClient.on('error', (err) => console.error('Redis error:', err));

async function init() {
  await redisClient.connect();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL DEFAULT 0
    )
  `);
  console.log('DB and Redis ready');
}

app.get('/items', async (req, res) => {
  try {
    const cached = await redisClient.get('items');
    if (cached) {
      cache_hits++;
      return res.json(JSON.parse(cached));
    }
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    await redisClient.setEx('items', 30, JSON.stringify(result.rows));
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/items', async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    await redisClient.del('items');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM products');
    res.json({ count: parseInt(result.rows[0].count), cache_hits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(3000, () => console.log('Server listening on port 3000')))
  .catch((err) => { console.error('Init failed:', err); process.exit(1); });
