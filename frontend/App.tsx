import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Capture from './src/screens/Capture';
import Preview from './src/screens/Preview';
import Result from './src/screens/Result';

export default function App() {
  const [screen, setScreen] = useState<'home'|'capture'|'preview'|'result'>('home');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  return (
    <View style={styles.container}>
      {screen === 'home' && (
        <View style={styles.center}>
          <Text style={styles.title}>Tomapresion</Text>
          <Button title="Nueva lectura" onPress={() => setScreen('capture')} />
          {lastResult && (
            <View style={{marginTop:20}}>
              <Text>Última: {lastResult.systolic}/{lastResult.diastolic} bpm {lastResult.pulse}</Text>
              <Button title="Ver resultado" onPress={() => setScreen('result')} />
            </View>
          )}
        </View>
      )}

      {screen === 'capture' && (
        <Capture
          onPhoto={(uri) => { setPhotoUri(uri); setScreen('preview'); }}
          onCancel={() => setScreen('home')}
        />
      )}

      {screen === 'preview' && photoUri && (
        <Preview
          uri={photoUri}
          onRetake={() => { setPhotoUri(null); setScreen('capture'); }}
          onSend={async (uri) => {
            setScreen('home');
            try {
              const res = await fetch('http://10.0.2.2:3000/api/scan', await (async () => {
                const form = new FormData();
                // React Native expects { uri, name, type }
                form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
                return { method: 'POST', body: form };
              })());
              const json = await res.json();
              setLastResult(json.record);
              setScreen('result');
            } catch (e) {
              console.error(e);
              alert('Error al enviar la imagen al servidor');
            }
          }}
        />
      )}

      {screen === 'result' && lastResult && (
        <Result record={lastResult} onBack={() => setScreen('home')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, marginBottom: 20 }
});
