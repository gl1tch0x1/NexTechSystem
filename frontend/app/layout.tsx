import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import 'dirham/css';
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
  title: {
    default: 'NexTech Systems | Enterprise Computer & Technology Commerce Platform',
    template: '%s | NexTech Systems',
  },
  description: 'Enterprise B2B/B2C commerce for high-performance computing, AI workstations, gaming systems, rack servers, and enterprise networking hardware.',
  keywords: ['computer hardware', 'PC builder', 'enterprise servers', 'GPUs', 'workstations', 'B2B technology', 'UAE electronics'],
  authors: [{ name: 'NexTech Systems' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'NexTech Systems - Enterprise Computer & Technology Platform',
    description: 'B2B/B2C computer hardware and technology commerce platform with real-time compatibility matrix and dynamic multi-currency pricing.',
    url: '/',
    siteName: 'NexTech Systems',
    locale: 'en_AE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}>
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
