# Tomapresion - App with Backend (MVP)

He añadido un backend minimal funcional en la rama feature/app-with-backend.

Qué incluye:
- server/: Express backend con OCR (tesseract.js) y generación de PDFs (pdfkit)
- storage: server/storage/db.json (JSON records) and server/storage/pdfs (PDF outputs)

Cómo probar rápido (local):

1) Backend

cd server
npm install
npm run start

2) Probar con curl (envía una foto):

curl -X POST -F "photo=@/path/to/photo.jpg" http://localhost:3000/api/scan

Esto devolverá un JSON con `record` y `pdfUrl`. Puedes abrir http://localhost:3000<pdfUrl> para descargar/ver el PDF.

Frontend

He incluido instrucciones y ejemplo de pantallas para integrar en tu app Expo en FRONTEND_EXAMPLE.md dentro del repo. La integración usa endpoint POST /api/scan con field `photo`.

Siguientes pasos recomendados:
- Ejecutar `npx expo prebuild --platform android` en tu máquina para comprobar que la prebuild funciona localmente con los cambios que ya están en la rama.
- Revisar google-services.json si usas Firebase.

Si quieres, ahora puedo:
- (A) subir assets del frontend y un ejemplo de pantalla implementado en React Native y commitearlo a la rama, o
- (B) dejar el backend como está y darte el fichero de ejemplo para que lo copies en tu proyecto.

Dime si quieres que implemente las pantallas en el repo y las suba a la rama (haré commit) o prefieres copiarlas tú mismo.
