import React from 'react';
import { View, Image, Button, StyleSheet } from 'react-native';

export default function Preview({ uri, onRetake, onSend }: { uri:string, onRetake: ()=>void, onSend: (uri:string)=>void }){
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      <View style={styles.row}>
        <Button title="Repetir" onPress={onRetake} />
        <Button title="Enviar" onPress={()=>onSend(uri)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  image: { flex:1, width:'100%' },
  row: { flexDirection:'row', justifyContent:'space-around', padding:20 }
});
