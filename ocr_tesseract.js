#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const COURSES_DIR = '/home/f/deutsch/Deutsch als Fremdsprache';
const pool = new Pool({ user: 'f', host: '/var/run/postgresql', database: 'deutsch' });

const pdfMap = {
  1: { kb: 'Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Lagune-1-Kursbuch.pdf', ab: 'Lagune 1-20230613T235903Z-001/Lagune 1/Arbeitsbuch + CD/Lagune_1_Arbeitsbuch.pdf' },
  2: { kb: 'Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Lagune-2-Kursbuch.pdf', ab: 'Lagune 2-20230613T235945Z-001/Lagune 2/Arbeitsbuch +CD/Lagune_2_Arbeitsbuch.pdf' },
  3: { kb: 'Lagune 3-20230614T000003Z-001/Lagune 3/Kursbuch + CD/Lagune-3-Kursbuch.pdf', ab: '' },
  4: { kb1: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram aktuell 1 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza Til Schönherr Eduard von Jan (z-lib.org).pdf', kb2: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram Z, Zertifikat Deutsch, Kursbuch und Arbeitsbuch by Rosa-Maria Dallapiazza, Eduard von Jan, Beate Blüggel, Anja Schümann (z-lib.org).pdf', ab: 'Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Ubungsheft.pdf' },
  5: { kb1: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/tangram aktuell 2 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza, Sabine Dinsel, Eduard Jan (z-lib.org).pdf', kb2: 'Tangram Aktuell 2-20230614T003043Z-001/Tangram Aktuell 2/Tangram Aktuell 2 Lektion 5-8. Kursbuch Und Arbeitsbuch by Rosa-Maria Dallapiazza Beate Blüggel Eduard von Jan Baby Neumann (z-lib.org).pdf', ab: 'Tangram Aktuell 2-20230614T003043Z-001/tangram Aktuell 2/Ubungsheft.pdf' },
  6: { kb: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Kursbuch 1-4.pdf', kb2: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Kursbuch 5-8.pdf', ab: 'Tangram Aktuell 3-20230614T003057Z-001/Tangram Aktuell 3/Ubungsheft.pdf' },
  7: { kb: 'Deutsch V/Menschen-A1-2-kursbuch.pdf', ab: '' },
  8: { kb: 'Deutsch V/Menschen A2.1 Kursbuch.pdf', ab: 'Deutsch V/Menschen-A2.2-Arbeitsbuch.pdf' },
  9: { kb: 'B2/HauptKurs.pdf', ab: 'B2/EM_Neu_AB.pdf' },
  10: { kb: 'C1/Kursbuch.pdf', ab: 'C1/Arbeitsbuch.pdf' }
};

function runTesseractOCR(pdfPath, pageNum, outputDir) {
  const tempPng = `/tmp/ocr_page_${pageNum}.png`;
  const outputTxt = `/tmp/ocr_text_${pageNum}.txt`;
  
  try {
    execSync(`pdftoppm -png -f ${pageNum} -l ${pageNum} -r 300 "${pdfPath}" /tmp/ocr_page`, { stdio: 'ignore' });
    
    if (fs.existsSync(tempPng)) {
      const result = execSync(`tesseract ${tempPng} stdout -l deu --psm 6`, { encoding: 'utf8' });
      fs.unlinkSync(tempPNG);
      return result.trim();
    }
  } catch (e) {
    console.log(`OCR failed for page ${pageNum}: ${e.message}`);
  }
  return null;
}

async function processPDF(cursoId, pdfPath, type) {
  if (!pdfPath) return;
  
  const fullPath = path.join(COURSES_DIR, pdfPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`PDF not found: ${fullPath}`);
    return;
  }
  
  const pageCount = parseInt(execSync(`pdfinfo "${fullPath}" 2>/dev/null | grep Pages | awk '{print $2}'`, { encoding: 'utf8' })) || 0;
  console.log(`Processing ${type} for course ${cursoId}: ${pageCount} pages`);
  
  for (let p = 1; p <= Math.min(pageCount, 10); p++) {
    console.log(`  OCR page ${p}/${pageCount}...`);
    const text = runTesseractOCR(fullPath, p);
    
    if (text && text.length > 50) {
      await pool.query(`
        INSERT INTO archivos (curso_id, pagina, tipo, texto_extraido)
        VALUES ($1, $2, $3, $4)
      `, [cursoId, p, type, text]);
      
      extractExercises(cursoId, p, text);
    }
  }
}

function extractExercises(cursoId, page, text) {
  const exercisePatterns = [
    /(\d+)\s*[\.\)]\s*([^\n]{10,200})/g,
    /Übung\s*(\d+)[^\n]*([^\n]{10,100})/g,
    /Aufgabe\s*(\d+)[^\n]*([^\n]{10,100})/g,
    /练习\s*(\d+)[^\n]*([^\n]{10,100})/g
  ];
  
  for (const pattern of exercisePatterns) {
    let match;
    while ((match = pattern.exec(text)) {
      const numero = match[1];
      const pregunta = match[2].substring(0, 200);
      
      pool.query(`
        INSERT INTO parsed_exercises (curso_id, unidad, ejercicio, pregunta, tipo_ejercicio)
        VALUES ($1, $2, $3, $4, 'ocr')
        ON CONFLICT DO NOTHING
      `, [cursoId, page, numero, pregunta]).catch(() => {});
    }
  }
}

async function main() {
  console.log('=== Better OCR with Tesseract ===');
  
  for (const [cursoId, paths] of Object.entries(pdfMap)) {
    console.log(`\nProcessing course ${cursoId}...`);
    await processPDF(cursoId, paths.kb, 'kursbuch');
    await processPDF(cursoId, paths.kb1, 'kursbuch');
    await processPDF(cursoId, paths.kb2, 'kursbuch');
    await processPDF(cursoId, paths.ab, 'arbeitsbuch');
  }
  
  console.log('\n=== OCR Complete ===');
  await pool.end();
}

main().catch(console.error);