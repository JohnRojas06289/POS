import type { Metadata } from 'next';
import { DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Providers } from './providers';
import '../styles/tokens.css';
import './globals.css';
import { THEME_IDS } from '../lib/themes';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'NEXUS POS',
  description: 'Sistema de punto de venta multi-tenant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <Providers>
          <ThemeProvider attribute="data-theme" defaultTheme="minimal" enableSystem themes={THEME_IDS}>
            <div id="main-content">
              {children}
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
