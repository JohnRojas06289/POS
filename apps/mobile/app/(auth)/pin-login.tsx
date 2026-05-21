import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PinLoginScreen() {
  const [tenantId, setTenantId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [step, setStep] = useState<'config' | 'pin'>('config');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const savedTenantId = await SecureStore.getItemAsync('pin_login_tenant_id');
      const savedBranchId = await SecureStore.getItemAsync('pin_login_branch_id');
      const savedFingerprint = await SecureStore.getItemAsync('device_fingerprint');

      if (savedTenantId) setTenantId(savedTenantId);
      if (savedBranchId) setBranchId(savedBranchId);

      if (savedFingerprint) {
        setDeviceFingerprint(savedFingerprint);
        return;
      }

      const generated = `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await SecureStore.setItemAsync('device_fingerprint', generated);
      setDeviceFingerprint(generated);
    };

    void bootstrap();
  }, []);

  const handleKey = async (key: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      await submitPin(next);
    }
  };

  const submitPin = async (p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: p,
          tenantId,
          branchId,
          deviceFingerprint,
          terminalName: 'Terminal móvil',
        }),
      });
      if (!res.ok) throw new Error('PIN inválido');
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      router.replace('/(tabs)/pos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ingresar');
      setPin('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'config') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Configurar Terminal</Text>
        <Text style={styles.label}>Tenant ID</Text>
        <TextInput
          value={tenantId}
          onChangeText={setTenantId}
          style={styles.input}
          autoCapitalize="none"
          placeholder="uuid del tenant"
        />
        <Text style={styles.label}>Branch ID</Text>
        <TextInput
          value={branchId}
          onChangeText={setBranchId}
          style={styles.input}
          autoCapitalize="none"
          placeholder="uuid de la sucursal"
        />
        <Text style={styles.deviceHint}>Huella del dispositivo: {deviceFingerprint || 'generando...'}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (tenantId && branchId && deviceFingerprint) {
              void SecureStore.setItemAsync('pin_login_tenant_id', tenantId);
              void SecureStore.setItemAsync('pin_login_branch_id', branchId);
              setStep('pin');
            }
          }}
        >
          <Text style={styles.primaryBtnText}>Continuar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEXUS POS</Text>
      <Text style={styles.subtitle}>Ingresa tu PIN</Text>

      {/* PIN dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, pin.length > i && styles.dotFilled]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
          k === '' ? (
            <View key={idx} style={styles.keyEmpty} />
          ) : (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => void handleKey(k)}
              disabled={loading}
            >
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          )
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#999' },
  dotFilled: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  error: { color: '#dc2626', marginBottom: 12, fontSize: 14 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12 },
  key: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: '#e5e7eb' },
  keyEmpty: { width: 64, height: 64 },
  keyText: { fontSize: 22, fontWeight: '500', color: '#111' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', alignSelf: 'flex-start', marginBottom: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, color: '#111', marginBottom: 12 },
  deviceHint: { width: '100%', color: '#6b7280', fontSize: 12, marginBottom: 8 },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
