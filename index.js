const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();  // Load environment variables from .env

const app = express();
const port = process.env.PORT || 3000;

// Connect to Neon Postgres using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Route for the root URL "/"
app.get('/', (req, res) => {
  res.send('Welcome to the Reading API!');
});

// Route to get all readers (your existing API route)
app.get('/api/readers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name FROM readers ORDER BY name');
    res.json({ readers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
