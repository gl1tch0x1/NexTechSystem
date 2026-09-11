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

  if (!activeCoupon) return null;

  const code = activeCoupon.code || 'TECH10';
  const discountText = activeCoupon.discountType === 'PERCENTAGE'
    ? `${activeCoupon.discountValue}%`
    : `AED ${activeCoupon.discountValue}`;
  const minSpend = activeCoupon.minOrderAmount ? `AED ${activeCoupon.minOrderAmount}` : 'AED 500';
  const badge = activeCoupon.badgeText || 'GCC Direct Enterprise Promotion';
  const title = activeCoupon.title || `Save ${discountText} on Enterprise Orders Over ${minSpend}`;
  const description = activeCoupon.description || 'Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.';
  const ctaText = activeCoupon.ctaText || 'Apply to Catalog';
  const ctaLink = activeCoupon.ctaLink || '/products';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-gradient-to-r from-blue-600/10 via-purple-600/15 to-tech-cyan/10 border border-tech-blue/30 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Voucher Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-tech-blue text-white flex items-center justify-center shadow-lg shadow-tech-blue/25 shrink-0">
            <BadgePercent className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{badge}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Right 1-Click Copy Voucher Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 font-mono font-black text-slate-900 dark:text-white text-sm shadow-sm hover:border-purple-500 transition-all cursor-pointer group w-full sm:w-auto"
            title="Click to copy voucher code"
          >
            <span className="text-purple-600 dark:text-purple-400 text-base tracking-wider">{code}</span>
            <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </div>
          </button>

          <Link
            href={ctaLink}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto text-center"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

