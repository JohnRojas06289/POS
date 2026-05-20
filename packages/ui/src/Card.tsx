import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export function Card({ children, padding = 16, style, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, { padding }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
