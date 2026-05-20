import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Providers } from './providers';
import '../styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXUS POS',
  description: 'Sistema de punto de venta multi-tenant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <Providers>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <div id="main-content">
              {children}
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
