import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  centered?: boolean;
}

export function Spinner({ size = 'large', color = '#2563eb', centered = false }: SpinnerProps) {
  if (centered) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
