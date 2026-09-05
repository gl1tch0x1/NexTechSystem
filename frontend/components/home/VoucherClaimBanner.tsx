'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Copy, Check, Sparkles, ArrowRight, BadgePercent } from 'lucide-react';
import { Coupon } from '@/types';

interface VoucherClaimBannerProps {
  activeCoupon?: Coupon;
}

export function VoucherClaimBanner({ activeCoupon }: VoucherClaimBannerProps) {
  const [copied, setCopied] = useState(false);

  const code = activeCoupon?.code || 'TECH10';
  const discountText = activeCoupon?.discountType === 'PERCENTAGE'
    ? `${activeCoupon.discountValue}%`
    : `AED ${activeCoupon?.discountValue || 100}`;
  const minSpend = activeCoupon?.minOrderAmount ? `AED ${activeCoupon.minOrderAmount}` : 'AED 500';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600/10 via-purple-600/15 to-tech-cyan/10 border border-tech-blue/30 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Voucher Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-tech-blue text-white flex items-center justify-center shadow-lg shadow-tech-blue/25 shrink-0">
            <BadgePercent className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>GCC Direct Enterprise Promotion</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Save {discountText} on Enterprise Orders Over {minSpend}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.
            </p>
          </div>
        </div>

        {/* Right 1-Click Copy Voucher Card */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 font-mono font-black text-slate-900 dark:text-white text-sm shadow-sm hover:border-purple-500 transition-all cursor-pointer group"
            title="Click to copy voucher code"
          >
            <span className="text-purple-600 dark:text-purple-400 text-base tracking-wider">{code}</span>
            <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </div>
          </button>

          <Link
            href="/products"
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <span>Apply to Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

