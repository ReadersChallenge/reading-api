const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Postgres connection using DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Set this in Vercel environment variables
  ssl: { rejectUnauthorized: false }  // Required for Neon (Postgres)
});

app.get('/api/names', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name FROM readers ORDER BY name');
    res.json({ names: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
