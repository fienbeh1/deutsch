const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3456;

const pool = new Pool({ user: 'f', host: '/var/run/postgresql', database: 'deutsch' });
const COURSES_DIR = '/home/f/deutsch/Deutsch als Fremdsprache';
const FRONTEND_DIR = '/home/f/deutsch/frontend-react';
const PAGES_DIR = '/home/f/deutsch/pages';

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));
app.use('/files', express.static(COURSES_DIR));
app.use('/audio', express.static(COURSES_DIR));

const pdfMap = {
  1: { kb: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Lagune-1-Kursbuch.pdf', ab: 'Lagune 1-20230613T235903Z-001/Lagune 1/Arbeitsbuch + CD/Lagune_1_Arbeitsbuch.pdf', lehrer: 'Lagune 1-20230613T235903Z-001/Lagune 1/Lagune 1 Lehrerhandbuch.pdf' },
  2: { kb: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Lagune-2-Kursbuch.pdf', ab: 'Lagune 2-20230613T235945Z-001/Lagune 2/Arbeitsbuch +CD/Lagune_2_Arbeitsbuch.pdf', lehrer: 'Lagune 2-20230613T235945Z-001/Lagune 2/Lehrerhandbuch.pdf' },
  3: { kb: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch + CD/Lagune-3-Kursbuch.pdf', ab: '', lehrer: 'Lagune 3-20230614T000003Z-001/Lagune 3/Lehrerhandbuch.pdf' },
  4: { kb1: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram aktuell 1 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza Til Schönherr Eduard von Jan (z-lib.org).pdf', kb2: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram Z, Zertifikat Deutsch, Kursbuch und Arbeitsbuch by Rosa-Maria Dallapiazza, Eduard von Jan, Beate Blüggel, Anja Schümann (z-lib.org).pdf', ab: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Ubungsheft.pdf' },
  5: { kb1: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/tangram aktuell 2 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza, Sabine Dinsel, Eduard Jan (z-lib.org).pdf', kb2: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/Tangram Aktuell 2 Lektion 5-8. Kursbuch Und Arbeitsbuch by Rosa-Maria Dallapiazza Beate Blüggel Eduard von Jan Baby Neumann (z-lib.org).pdf', ab: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/Ubungsheft.pdf' },
  6: { kb: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Kursbuch 1-4.pdf', kb2: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Kursbuch 5-8.pdf', ab: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Ubungsheft.pdf' },
  7: { kb: 'Deutsch V/Menschen-A1-2-kursbuch.pdf', ab: '' },
  8: { kb: 'Deutsch V/Menschen A2.1 Kursbuch.pdf', ab: 'Deutsch V/Menschen-A2.2-Arbeitsbuch.pdf' },
  9: { kb: 'B2/HauptKurs.pdf', ab: 'B2/EM_Neu_AB.pdf' },
  10: { kb: 'C1/Kursbuch.pdf', ab: 'C1/Arbeitsbuch.pdf' },
  11: { kb: 'The-Big-Yellow-Book-of-German-Verbs.pdf', ab: '', esVerbos: true }
};

const audioMap = {
  1: {
    name: 'Lagune 1',
    dirs: [
      { path: 'Lagune 1-20230613T235903Z-001/Lagune 1/Arbeitsbuch + CD/Arbeitsbuch-CD', label: 'Arbeitsbuch-CD' },
      { path: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Kursbuch-CD1', label: 'Kursbuch-CD1' },
      { path: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Kursbuch-CD2', label: 'Kursbuch-CD2' },
      { path: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Kursbuch-CD3', label: 'Kursbuch-CD3' }
    ]
  },
  2: {
    name: 'Lagune 2',
    dirs: [
      { path: 'Lagune 2-20230613T235945Z-001/Lagune 2/Arbeitsbuch +CD/CD', label: 'Arbeitsbuch-CD' },
      { path: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Kursbuch-CD1', label: 'Kursbuch-CD1' },
      { path: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Kursbuch-CD2', label: 'Kursbuch-CD2' },
      { path: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Kursbuch-CD3', label: 'Kursbuch-CD3' }
    ]
  },
  3: {
    name: 'Lagune 3', 
    dirs: [
      { path: 'Lagune 3-20230614T000003Z-001/Lagune 3/Arbeitsbuch + CD/CD', label: 'Arbeitsbuch-CD' },
      { path: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch +CD/AudioCD/CD1/MP3', label: 'Kursbuch-CD1' },
      { path: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch +CD/AudioCD/CD2/MP3', label: 'Kursbuch-CD2' },
      { path: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch +CD/AudioCD/CD3/MP3', label: 'Kursbuch-CD3' }
    ]
  },
  4: {
    name: 'Tangram 1',
    dirs: [
      { path: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/CD Arbeitsbuch 1-4', label: 'AB 1-4' },
      { path: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/CD Arbeitsbuch 5-8', label: 'AB 5-8' },
      { path: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/CD Kursbuch 1-4', label: 'KB 1-4' },
      { path: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/CD Kursbuch 5-8', label: 'KB 5-8' }
    ]
  },
  5: {
    name: 'Tangram 2',
    dirs: [
      { path: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/CD Arbeitsbuch 1-4', label: 'AB 1-4' },
      { path: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/CD Arbeitsbuch 5-8', label: 'AB 5-8' },
      { path: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/CD Kursbuch 1-4', label: 'KB 1-4' },
      { path: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/CD Kursbuch 5-8', label: 'KB 5-8' }
    ]
  },
  6: {
    name: 'Tangram 3',
    dirs: [
      { path: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/CD Arbeitsbuch 1-4', label: 'AB 1-4' },
      { path: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/CD Kursbuch 1-4', label: 'KB 1-4' },
      { path: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/CD Kursbuch 5-8', label: 'KB 5-8' }
    ]
  },
  9: {
    name: 'B2',
    dirs: [
      { path: 'B2/Kursbuch Hoertexte/EM neu - Hauptkurs cd 1', label: 'CD 1' },
      { path: 'B2/Kursbuch Hoertexte/EM neu - Hauptkurs cd 2', label: 'CD 2' }
    ]
  },
  10: {
    name: 'C1',
    dirs: [
      { path: 'C1/Kursbuch Hoertexte und Lehrerhandbuch Tests/Disk 1', label: 'Disk 1' },
      { path: 'C1/Kursbuch Hoertexte und Lehrerhandbuch Tests/Disk 2', label: 'Disk 2' }
    ]
  }
};

const { spawn, execSync } = require('child_process');

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// OCR endpoint - processes PDF pages
app.post('/api/pdf/ocr', async (req, res) => {
  const { pdf, curso, startPage = 1, endPage = null } = req.body;
  if (!pdf) return res.status(400).json({ error: 'PDF path required' });
  
  const pdfPath = path.join(COURSES_DIR, pdf);
  if (!fs.existsSync(pdfPath)) return res.status(404).json({ error: 'PDF not found' });
  
  try {
    const pageCount = parseInt(execSync(`pdfinfo "${pdfPath}" 2>/dev/null | grep Pages | awk '{print $2}'`, { encoding: 'utf8' })) || 0;
    const end = endPage || pageCount;
    
    res.json({ status: 'started', pdf, pages: pageCount, processing: `${startPage}-${end}` });
    
    for (let p = startPage; p <= end; p++) {
      const outFile = `/tmp/ocr_${curso}_${p}.txt`;
      try {
        execSync(`pdftotext -f ${p} -l ${p} "${pdfPath}" "${outFile}" 2>/dev/null`, { stdio: 'ignore' });
        if (fs.existsSync(outFile)) {
          const text = fs.readFileSync(outFile, 'utf8').trim();
          if (text.length > 50) {
            await pool.query(`
              INSERT INTO archivos (curso_id, pagina, tipo, texto_extraido)
              VALUES ($1, $2, 'ocr', $3)
            `, [curso, p, text]);
          }
          fs.unlinkSync(outFile);
        }
      } catch (e) { /* skip failed pages */ }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get exercises for a course
app.get('/api/ejercicios/:curso', async (req, res) => {
  const r = await pool.query(`
    SELECT ejercicio as numero, pregunta as pregunta, respuesta, 'text' as tipo
    FROM parsed_exercises 
    WHERE curso_id = $1 
    AND pregunta IS NOT NULL
    ORDER BY unidad, ejercicio
    LIMIT 300
  `, [req.params.curso]);
  res.json(r.rows);
});

// Add exercise
app.post('/api/ejercicios', async (req, res) => {
  const { curso_id, unidad, numero, tipo, pregunta, respuesta, opciones } = req.body;
  const r = await pool.query(`
    INSERT INTO ejercicios (curso_id, unidad, numero, tipo, pregunta, respuesta, opciones)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [curso_id, unidad, numero, tipo, pregunta, respuesta, opciones]);
  res.json(r.rows[0]);
});
app.get('/api/cursos', async (req, res) => { const r = await pool.query('SELECT * FROM cursos ORDER BY id'); res.json(r.rows); });
app.get('/api/file/:curso/:tipo/:pg', async (req, res) => {
  const { curso, tipo, pg } = req.params;
  const c = pdfMap[curso];
  if (!c) return res.json({ exists: false });
  
  let rel;
  // Check if there's a kb2 (second book) and use pg param to decide which one
  const useSecond = pg === '2';
  
  if (tipo === 'kursbuch') {
    rel = useSecond && c.kb2 ? c.kb2 : (c.kb1 || c.kb);
  } else if (tipo === 'arbeitsbuch') {
    rel = c.ab;
  } else {
    rel = c.lehrer;
  }
  
  if (!rel) return res.json({ exists: false });
  const pdfPath = path.join(COURSES_DIR, rel);
  const exists = fs.existsSync(pdfPath);
  res.json({ path: exists ? pdfPath : null, exists, tipo });
});
app.get('/api/audio/list/:curso', async (req, res) => {
  const { curso } = req.params;
  const audioInfo = audioMap[curso];
  if (!audioInfo) return res.json([]);
  
  let allFiles = [];
  for (const dir of audioInfo.dirs) {
    const fullPath = path.join(COURSES_DIR, dir.path);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.mp3')).sort();
      allFiles = allFiles.concat(files.map(f => ({ 
        file: f, 
        cd: dir.label, 
        path: `/audio/${dir.path}/${f}` 
      })));
    }
  }
  res.json(allFiles);
});
app.get('/api/audio/cds/:curso', async (req, res) => {
  const { curso } = req.params;
  const audioInfo = audioMap[curso];
  if (!audioInfo) return res.json([]);
  
  const cds = [];
  for (const dir of audioInfo.dirs) {
    const fullPath = path.join(COURSES_DIR, dir.path);
    if (fs.existsSync(fullPath)) {
      const count = fs.readdirSync(fullPath).filter(f => f.endsWith('.mp3')).length;
      cds.push({ label: dir.label, count, path: dir.path });
    }
  }
  res.json(cds);
});
app.get('/api/themenkreise/:curso', async (req, res) => {
  const r = await pool.query(`
    SELECT t.*, json_agg(json_build_object('numero', l.numero, 'titulo', l.titulo, 'fokus', l.fokus, 'paginas', l.paginas, 'es_anker', l.es_anker) ORDER BY l.numero) as einheiten
    FROM themenkreise t
    LEFT JOIN lerneinheiten l ON l.themenkreis_id = t.id
    WHERE t.curso_id = $1
    GROUP BY t.id
    ORDER BY t.numero
  `, [req.params.curso]);
  res.json(r.rows);
});

// Progress endpoints
app.get('/api/progress/:curso', async (req, res) => {
  const r = await pool.query('SELECT * FROM user_progress WHERE curso_id = $1', [req.params.curso]);
  res.json(r.rows);
});

app.post('/api/progress', async (req, res) => {
  const { curso_id, lektion, page, completed } = req.body;
  const r = await pool.query(`
    INSERT INTO user_progress (curso_id, lektion, page, completed)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (curso_id, lektion, page) DO UPDATE SET completed = $4
    RETURNING *
  `, [curso_id, lektion, page, completed]);
  res.json(r.rows[0]);
});

// Bookmarks endpoints
app.get('/api/bookmarks/:curso', async (req, res) => {
  const r = await pool.query('SELECT * FROM bookmarks WHERE curso_id = $1 ORDER BY created_at DESC', [req.params.curso]);
  res.json(r.rows);
});

app.post('/api/bookmarks', async (req, res) => {
  const { curso_id, lektion, page, note } = req.body;
  const r = await pool.query(`
    INSERT INTO bookmarks (curso_id, lektion, page, note)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (curso_id, lektion, page) DO UPDATE SET note = $4
    RETURNING *
  `, [curso_id, lektion, page, note]);
  res.json(r.rows[0]);
});

app.delete('/api/bookmarks/:id', async (req, res) => {
  await pool.query('DELETE FROM bookmarks WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Exercise answers / scores
app.get('/api/answers/:ejercicioId', async (req, res) => {
  const r = await pool.query('SELECT * FROM user_answers WHERE ejercicio_id = $1 ORDER BY created_at DESC', [req.params.ejercicioId]);
  res.json(r.rows);
});

app.post('/api/answers', async (req, res) => {
  const { ejercicio_id, user_answer, correct } = req.body;
  const r = await pool.query(`
    INSERT INTO user_answers (ejercicio_id, user_answer, correct)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [ejercicio_id, user_answer, correct]);
  res.json(r.rows[0]);
});

app.get('/api/scores/:curso', async (req, res) => {
  const r = await pool.query(`
    SELECT ua.correct, COUNT(*) as count, MAX(ua.created_at) as last_answer
    FROM user_answers ua
    JOIN parsed_exercises pe ON pe.id = ua.ejercicio_id
    WHERE pe.curso_id = $1
    GROUP BY ua.correct
  `, [req.params.curso]);
  res.json(r.rows);
});

// Serve page images (pre-converted PNGs)
app.get('/api/page/:curso/:type/:num', async (req, res) => {
  const { curso, type, num } = req.params;
  const pageNum = parseInt(num);
  
  const c = pdfMap[curso];
  if (!c) return res.status(404).json({ error: 'Course not found' });
  
  let pdfFile = type === 'kursbuch' ? (c.kb2 && pageNum > 50 ? c.kb2 : (c.kb1 || c.kb)) : c.ab;
  if (!pdfFile) return res.status(404).json({ error: 'PDF not found' });
  
  const pdfPath = path.join(COURSES_DIR, pdfFile);
  if (!fs.existsSync(pdfPath)) return res.status(404).json({ error: 'PDF file not found' });
  
  const outFile = path.join(PAGES_DIR, `${curso}_${type}`, `page-${String(pageNum).padStart(4, '0')}.png`);
  
  if (!fs.existsSync(path.dirname(outFile))) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
  }
  
  if (!fs.existsSync(outFile)) {
try {
    execSync(`pdftoppm -png -f ${pageNum} -l ${pageNum} -r 150 "${pdfPath}" "${outFile.replace('.png', '').replace(/page-\d+/, 'page')}"`, { stdio: 'ignore' });
  }
  }
  
  res.sendFile(outFile);
});

// Convert PDF page on demand
app.post('/api/page/convert', async (req, res) => {
  const { curso, type, pageNum } = req.body;
  
  const c = pdfMap[curso];
  if (!c) return res.status(404).json({ error: 'Course not found' });
  
  let pdfFile = type === 'kursbuch' ? (c.kb2 ? c.kb2 : (c.kb1 || c.kb)) : c.ab;
  if (!pdfFile) return res.status(404).json({ error: 'PDF not found' });
  
  const pdfPath = path.join(COURSES_DIR, pdfFile);
  const outDir = path.join(PAGES_DIR, `${curso}_${type}`);
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const outFile = path.join(outDir, `page-${String(pageNum).padStart(4, '0')}.png`);
  
  try {
    execSync(`pdftoppm -png -f ${pageNum} -l ${pageNum} -r 150 "${pdfPath}" "${outFile.replace('.png', '').replace(/page-\d+/, 'page')}"`, { stdio: 'ignore' });
    res.json({ ok: true, path: outFile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server: http://localhost:${PORT}`));
