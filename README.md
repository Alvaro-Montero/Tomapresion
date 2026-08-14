# Tomapresion (MVP)

App Android (Expo) para capturar la pantalla del tensiómetro, extraer presión arterial por OCR, almacenar en Firebase y exportar PDF con gráfica.

Pasos rápidos para poner en marcha:
1. Clona este repo en tu máquina.
2. Copia el archivo `google-services.json` (te lo pasé) a la raíz del proyecto.
3. Instala dependencias:
   - npm install
4. Ejecuta prebuild (Expo dev client):
   - expo prebuild
5. Build APK (requiere cuenta EAS y configuración):
   - eas build -p android --profile preview

Integración Firebase:
- El `google-services.json` ya está configurado para package `com.alvaro.tomapresion`.
- Habilitar autenticación anónima en Firebase Console.

Notas:
- El scaffold incluye un placeholder para OCR (ML Kit). Para producción integraremos el paquete nativo `react-native-google-mlkit-text-recognition`.
- No se incluye el `google-services.json` en el repo por seguridad; colócalo manualmente antes de ejecutar `expo prebuild`.

Entregables:
- Código fuente (este repo).
- Instrucciones para generar APK.
