import { Text, TextStyle } from 'react-native';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  style?: TextStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const fontSizes = { sm: 13, md: 16, lg: 20, xl: 28 };

export function CurrencyDisplay({
  amount,
  currency = 'COP',
  locale = 'es-CO',
  style,
  size = 'md',
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <Text
      style={[
        { fontSize: fontSizes[size], fontWeight: '700', color: '#111' },
        style,
      ]}
    >
      {formatted}
    </Text>
  );
}
