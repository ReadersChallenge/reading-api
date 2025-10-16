const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// Connect to Neon Postgres using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// -------------------- ROUTES --------------------

// Root route
app.get('/', (req, res) => res.send('Welcome to the Reading API!'));

// Get all reader names
app.get('/api/names', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name FROM readers ORDER BY name');
    res.json({ ok: true, names: rows.map(r => r.name) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

// Add a reading session
app.post('/api', async (req, res) => {
  try {
    const { name, minutes, date } = req.body;

    // Ensure reader exists
    let reader = await pool.query('SELECT id FROM readers WHERE name = $1', [name]);
    let readerId;
    if (reader.rows.length === 0) {
      const insertReader = await pool.query('INSERT INTO readers(name) VALUES($1) RETURNING id', [name]);
      readerId = insertReader.rows[0].id;
    } else {
      readerId = reader.rows[0].id;
    }

    // Insert session
    await pool.query('INSERT INTO logs(reader_id, minutes, date) VALUES($1, $2, $3)', [readerId, minutes, date]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to save session' });
  }
});

// Get aggregated stats
app.get('/api/stats', async (req, res) => {
  try {
    const { range, date } = req.query; // range=day|week|month|all
    let startDate;

    const d = new Date(date || new Date());
    if (range === 'day') startDate = new Date(d);
    else if (range === 'week') startDate = new Date(d.setDate(d.getDate() - 7));
    else if (range === 'month') startDate = new Date(d.setMonth(d.getMonth() - 1));
    else startDate = new Date(0); // All-time

    const { rows } = await pool.query(`
      SELECT r.name, SUM(l.minutes) as minutes
      FROM logs l
      JOIN readers r ON l.reader_id = r.id
      WHERE l.date >= $1
      GROUP BY r.name
      ORDER BY minutes DESC
    `, [startDate]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' });
  }
});

// -------------------- START SERVER --------------------
app.listen(port, () => console.log(`Server running on port ${port}`));
