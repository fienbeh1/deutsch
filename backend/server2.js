const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3456;

const pool = new Pool({ user: 'f', host: '/var/run/postgresql', database: 'deutsch' });
const COURSES_DIR = '/home/f/deutsch/Deutsch als Fremdsprache';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/files', express.static(COURSES_DIR));
app.use('/audio', express.static(COURSES_DIR));

const pdfMap = {
  1: { 
    nombre: 'Lagune 1',
    kursbuch: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Lagune-1-Kursbuch.pdf',
    arbeitsbuch: 'Lagune 1-20230613T235903Z-001/Lagune 1/Arbeitsbuch + CD/Lagune_1_Arbeitsbuch.pdf',
    audio: 'Lagune 1-20230613T235903Z-001/Lagune 1/Arbeitsbuch + CD/Arbeitsbuch-CD'
  },
  2: {
    nombre: 'Lagune 2',
    kursbuch: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Lagune-2-Kursbuch.pdf',
    arbeitsbuch: 'Lagune 2-20230613T235945Z-001/Lagune 2/Arbeitsbuch +CD/Lagune-2-Arbeitsbuch.pdf',
    audio: 'Lagune 2-20230613T235945Z-001/Lagune 2/Arbeitsbuch + CD/Arbeitsbuch-CD'
  },
  3: {
    nombre: 'Lagune 3',
    kursbuch: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch + CD/Lagune-3-Kursbuch.pdf',
    arbeitsbuch: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch + CD/Lagune-3-Kursbuch.pdf',
    audio: 'Lagune 3-20230614T000003Z-001/Lagune 3/Arbeitsbuch + CD/Arbeitsbuch-CD'
  },
  4: {
    nombre: 'Tangram 1',
    kursbuch: 'Tangram Aktuell 1-20230614T003502Z-001/tangram Aktuell 1/Tangram aktuell 1 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza Til Schönherr Eduard von Jan (z-lib.org).pdf',
    arbeitsbuch: 'Tangram Aktuell 1-20230614T003502Z-001/tangram Aktuell 1/Ubungsheft.pdf',
    audio: 'Tangram Aktuell 1-20230614T003502Z-001/tangram Aktuell 1/Audio'
  },
  5: {
    nombre: 'Tangram 2',
    kursbuch: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/Tangram aktuell 2 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza, Sabine Dinsel, Eduard Jan (z-lib.org).pdf',
    arbeitsbuch: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/Ubungsheft.pdf',
    audio: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/Audio'
  },
  6: {
    nombre: 'Tangram 3',
    kursbuch: 'Tangram Aktuell 3-20230614T003057Z-001/tangram Aktuell 3/Kursbuch 1-4.pdf',
    arbeitsbuch: 'Tangram Aktuell 3-20230614T003057Z-001/tangram Aktuell 3/Ubungsheft.pdf',
    audio: 'Tangram Aktuell 3-20230614T003057Z-001/tangram Aktuell 3/Audio'
  },
  7: { nombre: 'Menschen A1', kursbuch: 'Deutsch V/Menschen-A1-2-kursbuch.pdf', arbeitsbuch: '' },
  8: { nombre: 'Menschen A2', kursbuch: 'Deutsch V/Menschen A2.1 Kursbuch.pdf', arbeitsbuch: 'Deutsch V/Menschen-A2.2-Arbeitsbuch.pdf' },
  9: { nombre: 'EM B2', kursbuch: 'B2/HauptKurs.pdf', arbeitsbuch: 'B2/EM_Neu_AB.pdf', audio: 'B2' },
  10: { nombre: 'C1', kursbuch: 'C1/Kursbuch.pdf', arbeitsbuch: 'C1/Arbeitsbuch.pdf', audio: 'C1' },
  11: { nombre: 'Big Yellow Book', kursbuch: 'The-Big-Yellow-Book-of-German-Verbs.pdf', arbeitsbuch: '' }
};

function getPdfPath(cursoId, tipo) {
  const course = pdfMap[cursoId];
  if (!course) return null;
  const pdfRelativePath = course[tipo];
  if (!pdfRelativePath) return null;
  return path.join(COURSES_DIR, pdfRelativePath);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/cursos', async (req, res) => { 
  const r = await pool.query('SELECT * FROM cursos ORDER BY id'); 
  res.json(r.rows); 
});
app.get('/api/cursos/:id', async (req, res) => { 
  const r = await pool.query('SELECT * FROM cursos WHERE id = $1', [req.params.id]); 
  res.json(r.rows[0]); 
});
app.get('/api/cursos/:id/pages', async (req, res) => { 
  const r = await pool.query('SELECT * FROM archivos WHERE curso_id = $1 ORDER BY tipo, pagina', [req.params.id]); 
  res.json(r.rows); 
});
app.get('/api/cursos/:id/audio', async (req, res) => { 
  const r = await pool.query('SELECT * FROM audios WHERE curso_id = $1', [req.params.id]); 
  res.json(r.rows); 
});
app.get('/api/file/:curso/:tipo/:pg', async (req, res) => {
  const { curso, tipo } = req.params;
  const pdfPath = getPdfPath(parseInt(curso), tipo);
  const exists = pdfPath && fs.existsSync(pdfPath);
  res.json({ path: exists ? pdfPath : null, exists, curso, tipo });
});
app.get('/api/audio/list/:curso', async (req, res) => {
  const { curso } = req.params;
  const course = pdfMap[curso];
  if (!course || !course.audio) return res.json([]);
  
  const audioDir = path.join(COURSES_DIR, course.audio);
  if (!fs.existsSync(audioDir)) return res.json([]);
  
  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();
  res.json(files.map(f => ({ file: f, path: `/audio/${course.audio}/${f}` })));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server: http://localhost:${PORT}`));
