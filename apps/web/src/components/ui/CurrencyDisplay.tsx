interface CurrencyDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gold?: boolean;
}

export function CurrencyDisplay({ amount, size = 'md', gold }: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const sizes = {
    sm: 'text-[13px]',
    md: 'text-[16px]',
    lg: 'text-[24px]',
    xl: 'text-[36px] tracking-tight',
  };

  return (
    <span style={{ fontFamily: 'var(--font-mono)' }} className={`font-medium ${sizes[size]} ${gold ? 'text-[var(--text-gold-bright)]' : 'text-[var(--text-primary)]'}`}>
      {formatted}
    </span>
  );
}
