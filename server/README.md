# Tomapresion backend

This folder contains a minimal backend to accept an image (photo of the tensiometer), run OCR, parse the values and generate a PDF with the detected measurements.

Endpoints

- POST /api/scan
  - Form field: `photo` (multipart/form-data)
  - Returns: { ok: true, record, pdfUrl }

- GET /api/records
  - Returns list of saved records (JSON storage)

- GET /pdfs/:id.pdf
  - Serves the generated PDF

Quick start (local)

1. cd server
2. npm install
3. npm run start

Example curl (send a photo):

curl -X POST -F "photo=@/path/to/photo.jpg" http://localhost:3000/api/scan

Notes

- The server uses Tesseract.js for OCR. It does not permanently save uploaded images (per config). It saves generated PDFs and metadata in server/storage.
- For production, consider using a persistent DB (SQLite/Postgres) and cloud storage for PDFs.
