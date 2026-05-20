import { Platform, TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor="#9ca3af"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#dc2626' },
  error: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
