'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AIChatbotModal } from '@/components/ui/AIChatbotModal';

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isReseller = pathname.startsWith('/reseller');

  // Dedicated portal layouts for Admin & Reseller - completely isolated from consumer header, search, and footer
  if (isAdmin || isReseller) {
    return (
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    );
  }

  // Standard Storefront Shell
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <AIChatbotModal />
    </>
  );
}
