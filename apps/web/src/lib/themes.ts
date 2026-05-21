export type ThemeId = 'minimal' | 'light' | 'dark' | 'sepia' | 'graphite';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  accent: string;
  surface: string;
  muted: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'minimal', label: 'Minimalista', description: 'Neutro, silencioso y limpio.', accent: '#C9A84C', surface: '#F7F6F3', muted: '#EEEDE8' },
  { id: 'light', label: 'Claro', description: 'Más blanco, más aire y acento azul.', accent: '#2563EB', surface: '#FFFFFF', muted: '#F3F4F6' },
  { id: 'dark', label: 'Oscuro', description: 'Contraste alto para turnos largos.', accent: '#E8C96A', surface: '#111111', muted: '#1F1F1F' },
  { id: 'sepia', label: 'Sepia', description: 'Cálido, editorial y cómodo.', accent: '#A16207', surface: '#FBF4E7', muted: '#F1E4CC' },
  { id: 'graphite', label: 'Grafito', description: 'Monocromo premium y sobrio.', accent: '#9CA3AF', surface: '#111827', muted: '#1F2937' },
];

export const THEME_IDS = THEME_OPTIONS.map((theme) => theme.id);
