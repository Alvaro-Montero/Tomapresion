Quick start for the frontend (Expo)

1) cd frontend
2) npm install
3) npx expo start

Notes
- The app expects the backend to be accessible at http://10.0.2.2:3000 when running in an Android emulator. If you are testing on a physical device and the backend runs on your machine, use your PC's LAN IP (eg http://192.168.1.42:3000) and ensure the phone can access it.
- The example App.tsx uses a simple state-based screen flow (home -> capture -> preview -> result). It posts the image with field name `photo` to /api/scan.
