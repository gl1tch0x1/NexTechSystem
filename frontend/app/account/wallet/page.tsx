  'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-xs">
      Redirecting to Customer Portal...
    </div>
  );
}
