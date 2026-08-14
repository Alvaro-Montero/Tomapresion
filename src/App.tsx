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
  const [imageUri, setImageUri] = useState(null);
  const [ocrResult, setOcrResult] = useState({});

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
      // Aquí llamaremos al OCR (ML Kit) — placeholder
      runOcrOnImage(result.uri);
    }
  };

  const runOcrOnImage = async (uri) => {
    // Placeholder: integrarse con ML Kit nativo (react-native-google-mlkit-text-recognition)
    // Por ahora simulamos extracción
    // Ejemplo de pattern: "120/80 72"
    setTimeout(() => {
      setOcrResult({ systolic: 120, diastolic: 80, pulse: 72 });
    }, 800);
  };

  const saveRecord = async () => {
    try {
      let imageUrl = null;
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `images/${Date.now()}.jpg`;
        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }
      const docRef = await addDoc(collection(db, 'readings'), {
        systolic: ocrResult.systolic || null,
        diastolic: ocrResult.diastolic || null,
        pulse: ocrResult.pulse || null,
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
