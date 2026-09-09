import React from 'react';
import { View, Text, Button, StyleSheet, Linking } from 'react-native';

export default function Result({ record, onBack }: { record:any, onBack: ()=>void }){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultado</Text>
      <Text style={styles.item}>Sistólica: {record.systolic ?? 'N/A'}</Text>
      <Text style={styles.item}>Diastólica: {record.diastolic ?? 'N/A'}</Text>
      <Text style={styles.item}>Pulso: {record.pulse ?? 'N/A'}</Text>
      <Button title="Abrir PDF" onPress={() => {
        const url = `http://10.0.2.2:3000${record.pdfPath}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) Linking.openURL(url);
          else alert('No se puede abrir el PDF en este dispositivo: ' + url);
        }).catch(() => alert('No se pudo abrir el PDF'));
      }} />
      <Button title="Volver" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:22, marginBottom:12, textAlign:'center' },
  item: { fontSize:18, marginVertical:6 }
});
