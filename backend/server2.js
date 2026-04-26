const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3456;

const pool = new Pool({
  user: 'f',
  host: '/var/run/postgresql',
  database: 'deutsch',
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/audio', express.static('/home/f/deutsch/Deutsch als Fremdsprache'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/cursos', async (req, res) => { const r = await pool.query('SELECT * FROM cursos ORDER BY id'); res.json(r.rows); });
app.get('/api/cursos/:id/detalle', async (req, res) => {
  const { id } = req.params;
  const curso = await pool.query('SELECT * FROM cursos WHERE id = $1', [id]);
  const pages = await pool.query('SELECT * FROM archivos WHERE curso_id = $1', [id]);
  const audios = await pool.query('SELECT * FROM audios WHERE curso_id = $1', [id]);
  res.json({ ...curso.rows[0], pages: pages.rows, audios: audios.rows });
});
app.get('/api/cursos/:id/:tipo', async (req, res) => {
  const { id, tipo } = req.params;
  const r = await pool.query('SELECT * FROM archivos WHERE curso_id = $1 AND tipo = $2', [id, tipo]);
  res.json(r.rows);
});
app.get('/api/audio/:id', async (req, res) => {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM audios WHERE curso_id = $1', [id]);
  res.json(r.rows);
});
app.listen(PORT, '0.0.0.0', () => console.log(`Server: http://localhost:${PORT}`));
