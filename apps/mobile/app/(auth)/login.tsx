import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantEmail: email, email, password }),
      });

      if (res.ok) {
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        await SecureStore.setItemAsync('access_token', data.accessToken);
        await SecureStore.setItemAsync('refresh_token', data.refreshToken);
        router.replace('/(tabs)/pos');
      }
    } catch {
      // handle error
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEXUS POS</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, color: '#0ea5e9' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
