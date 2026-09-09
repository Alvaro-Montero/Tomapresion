const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { generatePdf } = require('./pdf');
const { parseOcrText } = require('./ocr');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const STORAGE_DIR = path.join(__dirname, 'storage');
const PDF_DIR = path.join(STORAGE_DIR, 'pdfs');
const DB_FILE = path.join(STORAGE_DIR, 'db.json');

fs.ensureDirSync(PDF_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeJsonSync(DB_FILE, []);

// multer: memory storage (we don't keep original images) + limits + mime check
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  }
});

// Simple write queue to avoid concurrent write collisions to db.json
const writeQueue = [];
let writing = false;
function enqueueWrite(record) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ record, resolve, reject });
    processQueue();
  });
}
function processQueue() {
  if (writing) return;
  const item = writeQueue.shift();
  if (!item) return;
  writing = true;
  try {
    const db = fs.readJsonSync(DB_FILE);
    db.unshift(item.record);
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
    item.resolve();
  } catch (err) {
    item.reject(err);
  } finally {
    writing = false;
    // process next
    setImmediate(processQueue);
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/scan', (req, res) => {
  // Use multer as a function so we can catch errors synchronously
  upload.single('photo')(req, res, async function (err) {
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: String(err.message || err) });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded with field name "photo"' });

      const buffer = req.file.buffer;

      // Run OCR (Tesseract)
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');

      // Parse text for blood pressure and pulse
      const parsed = parseOcrText(text);

      // Generate PDF (we will save PDFs but not the original image)
      const id = uuidv4();
      const pdfPath = path.join(PDF_DIR, `${id}.pdf`);

      try {
        await generatePdf({ ...parsed, rawText: text }, pdfPath);
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
        // fallback: still create a minimal PDF
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        doc.fontSize(16).text('Tomapresion - Result (fallback PDF)');
        doc.text(`Systolic: ${parsed.systolic ?? 'N/A'}`);
        doc.text(`Diastolic: ${parsed.diastolic ?? 'N/A'}`);
        doc.text(`Pulse: ${parsed.pulse ?? 'N/A'}`);
        doc.end();
        await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
      }

      // Save record in db.json (storage in JSON as requested) using queue to avoid collisions
      const record = {
        id,
        systolic: parsed.systolic || null,
        diastolic: parsed.diastolic || null,
        pulse: parsed.pulse || null,
        rawTextPreview: (text || '').slice(0, 500),
        createdAt: new Date().toISOString(),
        pdfPath: `/pdfs/${id}.pdf`
      };

      await enqueueWrite(record);

      return res.json({ ok: true, record, pdfUrl: `/pdfs/${id}.pdf` });
    } catch (err) {
      console.error('Scan error:', err);
      return res.status(500).json({ error: String(err) });
    }
  });
});

// serve generated pdfs
app.get('/pdfs/:id.pdf', (req, res) => {
  const id = req.params.id;
  const file = path.join(PDF_DIR, `${id}.pdf`);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(file).pipe(res);
});

// list records
app.get('/api/records', (req, res) => {
  const db = fs.readJsonSync(DB_FILE);
  res.json(db);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tomapresion server running on http://localhost:${PORT}`));
