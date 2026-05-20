import { View, Text, StyleSheet } from 'react-native';

export default function PosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Punto de Venta</Text>
      <Text style={styles.subtitle}>Módulo POS — en desarrollo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { marginTop: 8, color: '#6b7280' },
});
