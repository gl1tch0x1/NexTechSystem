'use client';

import { useState } from 'react';
import { ShieldCheck, Info, X, Check, Sparkles } from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';

interface BnplPromoBadgeProps {
  price: number;
  className?: string;
  compact?: boolean;
}

export default function BnplPromoBadge({ price, className = '', compact = false }: BnplPromoBadgeProps) {
  const { formatPrice } = useCurrency();
  const [showModal, setShowModal] = useState(false);

  if (!price || price <= 0) return null;

  const installmentAmount = price / 4;
  const formattedInstallment = formatPrice(installmentAmount);

  return (
    <>
      <div
        className={`p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-medium">
              Or 4 interest-free installments of{' '}
              <strong className="text-slate-900 dark:text-white font-bold text-sm">
                {formattedInstallment}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tamara Badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black tracking-tight bg-[#FA6651]/10 text-[#FA6651] border border-[#FA6651]/20 shadow-2xs cursor-pointer hover:bg-[#FA6651]/20 transition-colors"
              onClick={() => setShowModal(true)}
              title="Pay in 4 with Tamara"
            >
              tamara
            </span>

            {/* Tabby Badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black tracking-tight bg-[#3EEDBF]/15 text-emerald-600 dark:text-[#3EEDBF] border border-[#3EEDBF]/30 shadow-2xs cursor-pointer hover:bg-[#3EEDBF]/25 transition-colors"
              onClick={() => setShowModal(true)}
              title="Split in 4 with Tabby"
            >
              tabby
            </span>

            {/* Learn More Button */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Learn about Buy Now Pay Later"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!compact && (
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" /> 0% Interest
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" /> No Hidden Fees
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-tech-blue" /> Sharia Compliant
            </span>
          </div>
        )}
      </div>

      {/* Educational Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-tech-blue dark:text-tech-cyan border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GCC Buy Now Pay Later</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Split Your Purchase in 4
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pay 25% today, and the rest in 3 interest-free monthly installments.
              </p>
            </div>

            {/* Plan Breakdown */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                4-Month Payment Schedule
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Today', note: 'Due now' },
                  { label: 'Month 1', note: 'In 30 days' },
                  { label: 'Month 2', note: 'In 60 days' },
                  { label: 'Month 3', note: 'In 90 days' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.label}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">{formattedInstallment}</div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Options */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Choose your preferred GCC provider at checkout:
              </div>

              {/* Tamara Box */}
              <div className="p-3.5 rounded-xl border border-[#FA6651]/30 bg-[#FA6651]/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-[#FA6651]">Tamara</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Split in 4. Available across UAE, KSA, Kuwait &amp; Bahrain.
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FA6651]/20 text-[#FA6651]">
                  0% APR
                </span>
              </div>

              {/* Tabby Box */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-600 dark:text-[#3EEDBF]">Tabby</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    4 interest-free payments with instant mobile approval.
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-[#3EEDBF]">
                  No Fees
                </span>
              </div>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero interest or fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Instant UAE ID verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Debit &amp; Credit Cards accepted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>FTA VAT compliant invoice</span>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-colors"
            >
              Got It &bull; Continue Shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
}
