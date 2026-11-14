'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, ArrowRight, BadgePercent } from 'lucide-react';
import { Coupon } from '@/types';

interface VoucherClaimBannerProps {
  activeCoupon?: Coupon;
}

export function VoucherClaimBanner({ activeCoupon }: VoucherClaimBannerProps) {
  const [copied, setCopied] = useState(false);

  if (!activeCoupon || activeCoupon.isActive === false) return null;

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
    <section className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        {/* Left Voucher Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <BadgePercent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-900/60 text-[9.5px] font-mono font-bold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>{badge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Right 1-Click Copy Voucher Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-mono font-bold text-slate-900 dark:text-white text-xs shadow-2xs hover:border-blue-500 transition-colors cursor-pointer group w-full sm:w-auto"
            title="Click to copy voucher code"
          >
            <span className="text-blue-600 dark:text-cyan-400 text-sm tracking-wider font-extrabold">{code}</span>
            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          <Link
            href={ctaLink}
            className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto text-center hover:scale-101 active:scale-98"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
