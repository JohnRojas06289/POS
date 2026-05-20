import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const bg: Record<BadgeVariant, string> = {
  success: '#dcfce7',
  warning: '#fef9c3',
  danger: '#fee2e2',
  info: '#dbeafe',
  neutral: '#f3f4f6',
};

const color: Record<BadgeVariant, string> = {
  success: '#16a34a',
  warning: '#a16207',
  danger: '#dc2626',
  info: '#2563eb',
  neutral: '#374151',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg[variant] }]}>
      <Text style={[styles.text, { color: color[variant] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  text: { fontSize: 12, fontWeight: '600' },
});
