'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/analytics';

/**
 * Google Analytics 4 (GA4) Script Component
 * Loads gtag.js asynchronously without impacting Core Web Vitals.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setEnabled(process.env.NODE_ENV === 'production' && /^G-[A-Z0-9]+$/.test(GA_TRACKING_ID) &&
      hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1');
  }, []);

  // A local production build should stay as quiet as the development server.
  if (!enabled) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              transport_type: 'beacon',
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
