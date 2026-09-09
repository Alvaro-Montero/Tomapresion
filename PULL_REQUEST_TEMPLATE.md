# Pull request: MVP app + backend

This PR adds a minimal, working MVP of the Tomapresion mobile app (frontend) and a backend service (server) that performs OCR on uploaded images and generates PDF reports.

What I added

- server/ - Node.js + Express backend
  - POST /api/scan: accepts multipart form `photo` and returns parsed blood pressure values and a PDF URL
  - GET /api/records: list of saved readings (JSON storage)
  - GET /pdfs/:id.pdf: serves generated PDF
  - Uses tesseract.js for OCR and pdfkit + chartjs-node-canvas for PDF generation
  - storage/ contains db.json and (after running) generated pdfs

- frontend/ - Expo (React Native) mobile app example
  - App.tsx: small navigation between home/capture/preview/result
  - src/screens/Capture.tsx - camera capture (expo-camera)
  - src/screens/Preview.tsx - preview and send
  - src/screens/Result.tsx - shows parsed values and opens PDF

Why this helps
- You can now take a photo of a blood pressure device, upload it to the backend, receive parsed systolic/diastolic/pulse values and a generated PDF containing the result and a simple chart.

How to test locally
1) Backend
  cd server
  npm install
  npm run start
  curl -X POST -F "photo=@/path/to/photo.jpg" http://localhost:3000/api/scan

2) Frontend
  cd frontend
  npm install
  npx expo start
  Use http://10.0.2.2:3000 for Android emulator or your machine LAN IP for a real device.

Notes & limitations
- The OCR is heuristic-based and results depend on photo quality.
- The backend currently stores metadata in server/storage/db.json for simplicity.
- For production, consider using a DB (SQLite/Postgres) and cloud storage for PDFs.

Next steps (optional)
- Improve OCR parser heuristics or add a training step for specific tensiometer screens
- Add authentication and per-user storage
- Deploy backend to Render/Railway and point the mobile app to the public URL

If you want me to merge this PR after your review, say so and I will merge it.