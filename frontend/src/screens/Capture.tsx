import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';

export default function Capture({ onPhoto, onCancel }: { onPhoto: (uri:string)=>void, onCancel: ()=>void }){
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
    onPhoto(photo.uri);
  };

  if (hasPermission === null) return <View><Text>Solicitando permisos...</Text></View>;
  if (hasPermission === false) return <View><Text>No se otorgaron permisos a la cámara</Text></View>;

  return (
    <View style={{ flex:1 }}>
      <Camera style={{ flex:1 }} ref={(r)=>cameraRef.current = r}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={onCancel}><Text>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.capture} onPress={takePhoto}><Text>📸</Text></TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { flex:1, backgroundColor:'transparent', flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', padding:20 },
  button: { backgroundColor:'#fff', padding:10, borderRadius:6 },
  capture: { backgroundColor:'#fff', padding:20, borderRadius:40 }
});
