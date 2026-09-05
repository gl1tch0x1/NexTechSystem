import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { StoreShell } from '@/components/layout/StoreShell';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

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
    <html lang="en" suppressHydrationWarning>
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
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased selection:bg-tech-blue selection:text-white transition-colors duration-200">
        <GoogleAnalytics />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <StoreShell>
                {children}
              </StoreShell>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
