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

// use memory storage because user requested not to keep images
const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/scan', upload.single('photo'), async (req, res) => {
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

    await generatePdf({ ...parsed, rawText: text }, pdfPath);

    // Save record in db.json (storage in JSON as requested)
    const db = fs.readJsonSync(DB_FILE);
    const record = {
      id,
      systolic: parsed.systolic || null,
      diastolic: parsed.diastolic || null,
      pulse: parsed.pulse || null,
      rawTextPreview: (text || '').slice(0, 500),
      createdAt: new Date().toISOString(),
      pdfPath: `/pdfs/${id}.pdf`
    };
    db.unshift(record);
    fs.writeJsonSync(DB_FILE, db, { spaces: 2 });

    return res.json({ ok: true, record, pdfUrl: `/pdfs/${id}.pdf` });
  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: String(err) });
  }
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
