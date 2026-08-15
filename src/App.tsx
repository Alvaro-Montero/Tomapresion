import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// Inicializa Firebase (usa el google-services.json para nativo; web usa firebaseConfig)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ systolic?: number | null; diastolic?: number | null; pulse?: number | null }>({});
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso a la cámara para funcionar');
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8
    });
    if (!result.cancelled) {
      setImageUri(result.uri);
      // Llama al OCR nativo (si está instalado); si no, usa fallback simulado
      runOcrOnImage(result.uri);
    }
  };

  const parseBpFromText = (text: string) => {
    // Busca patrón típico "120/80" para sistólica/diastólica
    const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    let systolic = bpMatch ? parseInt(bpMatch[1], 10) : null;
    let diastolic = bpMatch ? parseInt(bpMatch[2], 10) : null;

    // Busca pulso por etiquetas comunes
    let pulse: number | null = null;
    const pulseMatch = text.match(/(?:pulse|pulso|bpm)[:\s]*?(\d{2,3})/i);
    if (pulseMatch) {
      pulse = parseInt(pulseMatch[1], 10);
    } else {
      // Si no hay etiqueta, intenta inferir: encuentra todos los números de 2-3 dígitos
      const nums = (text.match(/\d{2,3}/g) || []).map(n => parseInt(n, 10));
      if (nums.length > 0) {
        // Quita los que ya usamos para la presión
        const remaining = nums.filter(n => n !== systolic && n !== diastolic);
        if (remaining.length > 0) {
          pulse = remaining[0];
        }
      }
    }

    return { systolic, diastolic, pulse };
  };

  const runOcrOnImage = async (uri: string) => {
    setRecognizing(true);
    try {
      // Intentamos carga dinámica del módulo ML Kit. Requiere que instales
      // @react-native-ml-kit/text-recognition (o la variante que prefieras)
      // y ejecutes `expo prebuild` para crear los enlaces nativos.
      let fullText = '';
      try {
        const mlkitModule = await import('@react-native-ml-kit/text-recognition');
        // El módulo puede exportar por defecto o como named export
        const TextRecognition = mlkitModule.default ?? mlkitModule;
        // recognize(uri) es la API común: el resultado tiene .text
        const res: any = await TextRecognition.recognize(uri);
        fullText = res?.text ?? '';
      } catch (e) {
        console.warn('ML Kit no disponible o falla en import dinámico, usando fallback. Error:', e?.message ?? e);
        // Fallback: simulamos resultado si no hay ML Kit instalado
        fullText = '120/80 72';
      }

      const parsed = parseBpFromText(fullText);
      setOcrResult({
        systolic: parsed.systolic,
        diastolic: parsed.diastolic,
        pulse: parsed.pulse
      });

      if (!parsed.systolic && !parsed.diastolic && !parsed.pulse) {
        Alert.alert('OCR', 'No se detectaron valores en la imagen');
      }
    } catch (err) {
      console.error('Error en OCR:', err);
      Alert.alert('Error OCR', 'Ocurrió un error al procesar la imagen');
    } finally {
      setRecognizing(false);
    }
  };

  const saveRecord = async () => {
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `images/${Date.now()}.jpg`;
        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }
      const docRef = await addDoc(collection(db, 'readings'), {
        systolic: ocrResult.systolic ?? null,
        diastolic: ocrResult.diastolic ?? null,
        pulse: ocrResult.pulse ?? null,
        timestamp: new Date().toISOString(),
        imageUrl
      });
      Alert.alert('Guardado', 'Registro guardado en Firebase');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el registro');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tomapresion</Text>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Tomar foto del tensiómetro</Text>
      </TouchableOpacity>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}

      <View style={styles.ocrBox}>
        <Text>Sistólica: {ocrResult.systolic ?? '-'}</Text>
        <Text>Diastólica: {ocrResult.diastolic ?? '-'}</Text>
        <Text>Pulso: {ocrResult.pulse ?? '-'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={saveRecord}>
        <Text style={styles.buttonText}>Guardar registro</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10 }}>
        <Text style={{ color: '#666' }}>{recognizing ? 'Reconociendo texto...' : ' '}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  button: { backgroundColor: '#1565C0', padding: 12, borderRadius: 8, marginVertical: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  image: { width: 300, height: 200, marginVertical: 10, resizeMode: 'contain' },
  ocrBox: { marginTop: 10, padding: 10, borderColor: '#ddd', borderWidth: 1, width: '100%' }
});
