import { Platform, Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const bgColor: Record<Variant, string> = {
  primary: '#2563eb',
  secondary: '#6b7280',
  danger: '#dc2626',
  ghost: 'transparent',
  outline: 'transparent',
};

const textColor: Record<Variant, string> = {
  primary: '#fff',
  secondary: '#fff',
  danger: '#fff',
  ghost: '#374151',
  outline: '#2563eb',
};

const paddingV: Record<Size, number> = { sm: 6, md: 10, lg: 14 };
const paddingH: Record<Size, number> = { sm: 12, md: 16, lg: 24 };
const fontSize: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor[variant],
          paddingVertical: paddingV[size],
          paddingHorizontal: paddingH[size],
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? '#2563eb' : 'transparent',
          opacity: (disabled || loading) ? 0.5 : pressed && !isWeb ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={textColor[variant]}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: textColor[variant], fontSize: fontSize[size] },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  } as ViewStyle,
  text: {
    fontWeight: '600',
  } as TextStyle,
});
