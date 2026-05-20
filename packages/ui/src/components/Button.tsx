import React from 'react';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  // Stub — implementar con NativeWind en la siguiente fase
  return null;
}
