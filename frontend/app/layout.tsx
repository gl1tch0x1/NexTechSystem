import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { StoreShell } from '@/components/layout/StoreShell';
import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'NexTech Systems | Enterprise Computer & Technology Platform',
  description: 'Premier B2B/B2C marketplace for CPUs, RTX 4090 GPUs, Rack Servers, Workstations, Enterprise Networking and PC Builder compatibility matrix.',
  keywords: ['enterprise computing', 'servers', 'RTX 4090', 'Intel Core i9', 'PC builder', 'networking', 'technology ecommerce'],
  authors: [{ name: 'NexTech Systems Enterprise' }],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('nextech_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark) || saved === 'system' && prefersDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else if (saved === 'light' || (!saved && !prefersDark) || saved === 'system' && !prefersDark) {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased selection:bg-tech-blue selection:text-white transition-colors duration-200 w-full max-w-full overflow-x-hidden">
        <GoogleAnalytics />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <CurrencyProvider>
                <GlobalCommandPalette />
                <StoreShell>
                  {children}
                </StoreShell>
              </CurrencyProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
