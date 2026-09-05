'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  FileCheck,
  Bot,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
  Server
} from 'lucide-react';
import { BentoFeature } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck,
  creditcard: CreditCard,
  flame: Flame,
  bot: Bot,
  award: Award,
  shield: ShieldCheck,
  headphones: Headphones,
  zap: Zap,
  server: Server
};

const COLOR_MAP: Record<string, { bgGlow: string; iconBg: string; textCol: string; borderCol: string }> = {
  truck: { bgGlow: 'bg-tech-blue/10', iconBg: 'bg-tech-blue/10 text-tech-blue dark:text-tech-cyan group-hover:bg-tech-blue group-hover:text-white', textCol: 'text-tech-blue dark:text-tech-cyan', borderCol: 'hover:border-tech-blue/50' },
  creditcard: { bgGlow: 'bg-purple-600/10', iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white', textCol: 'text-purple-600 dark:text-purple-300', borderCol: 'hover:border-purple-500/50' },
  flame: { bgGlow: 'bg-amber-600/10', iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white', textCol: 'text-amber-600 dark:text-amber-300', borderCol: 'hover:border-amber-500/50' },
  bot: { bgGlow: 'bg-emerald-600/10', iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white', textCol: 'text-emerald-600 dark:text-emerald-300', borderCol: 'hover:border-emerald-500/50' },
};

const FALLBACK_FEATURES: BentoFeature[] = [
  {
    id: 'feature-logistics',
    title: 'Insured Regional Express Dispatch & Real-Time Tracking',
    subtitle: '⚡ GCC EXPRESS LOGISTICS',
    description: 'Complimentary insured delivery on all hardware orders exceeding AED 500. Same-day dispatch across Dubai & Abu Dhabi, with guaranteed 24-48 hour regional express transit to Riyadh, Doha, Kuwait, Muscat, and Manama.',
    tag: 'LOGISTICS',
    iconName: 'truck',
    gridSpan: 7,
    stats: [
      { label: 'Zero-Loss Protection', value: '100% Insured' },
      { label: 'UAE Direct Hubs', value: 'Same-Day' },
      { label: 'GPS Route Tracking', value: 'Real-Time' }
    ],
    order: 1,
    isActive: true,
  },
  {
    id: 'feature-credit',
    title: 'Net-30 Enterprise Credit & Digital Wallet Settlement',
    subtitle: '💼 RESELLER TERMS',
    description: 'Streamlined procurement for system integrators with automated Zakat/VAT compliant invoices, escrow settlement, and instant wallet balance margin top-ups.',
    tag: 'CREDIT',
    iconName: 'creditcard',
    gridSpan: 5,
    ctaText: 'Apply for Enterprise Terms',
    ctaLink: '/auth',
    order: 2,
    isActive: true,
  },
  {
    id: 'feature-burnin',
    title: '24-Hour Prime95 & FurMark Thermal Burn-In',
    subtitle: '🔥 24H TORTURE TEST',
    description: 'Every assembled workstation and rack server node undergoes sustained load testing to verify VRM thermal efficiency and eliminate hardware defects before handover.',
    tag: 'STABILITY',
    iconName: 'flame',
    gridSpan: 5,
    statusBadge: 'Certified Stable',
    order: 3,
    isActive: true,
  },
  {
    id: 'feature-ai',
    title: 'Enterprise AI Hardware Specialist & Live Technical Support',
    subtitle: '🤖 24/7 AI SPECIALIST',
    description: 'Calculate PCIe lane distribution, check cooler clearances, or verify DDR5 ECC memory timings instantly with our datasheet-trained assistant and senior hardware engineering staff.',
    tag: 'SUPPORT',
    iconName: 'bot',
    gridSpan: 7,
    statusBadge: 'AI Engine Online',
    order: 4,
    isActive: true,
  }
];

interface EnterpriseBentoGridProps {
  features?: BentoFeature[];
}

export function EnterpriseBentoGrid({ features = [] }: EnterpriseBentoGridProps) {
  const activeFeatures = (features && features.length > 0) ? features : FALLBACK_FEATURES;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4" />
            <span>The NexTech Advantage</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Why Enterprise Tech Teams Trust NexTech
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Engineered for mission-critical reliability, transparent procurement, and rapid GCC deployment.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {activeFeatures.map((feat) => {
          const key = feat.iconName?.toLowerCase() || 'truck';
          const Icon = ICON_MAP[key] || Award;
          const colSpanClass = feat.gridSpan === 7 ? 'md:col-span-7' : 'md:col-span-5';
          const colors = COLOR_MAP[key] || COLOR_MAP.truck;

          return (
            <div
              key={feat.id}
              className={`group relative ${colSpanClass} rounded-3xl p-7 sm:p-8 bg-gradient-to-br from-blue-600/5 via-slate-50 to-white dark:from-blue-900/15 dark:via-[#0E1527] dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 ${colors.borderCol} flex flex-col justify-between hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1`}
            >
              <div className={`absolute -top-16 -right-16 w-48 h-48 ${colors.bgGlow} rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity pointer-events-none`} />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-13 h-13 rounded-2xl ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-all shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full bg-tech-blue/10 ${colors.textCol} border border-tech-blue/30 text-[10px] font-mono font-bold uppercase tracking-wider`}>
                    {feat.subtitle}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-xl font-normal">
                    {feat.description}
                  </p>
                </div>
              </div>

              {/* Bottom section conditional rendering */}
              {feat.stats && feat.stats.length > 0 && (
                <div className="relative z-10 pt-6 mt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  {feat.stats.map((s, sIdx) => (
                    <div key={sIdx} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                      <div className="font-mono font-black text-slate-900 dark:text-white text-sm">{s.value}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {feat.ctaText && feat.ctaLink && (
                <div className="relative z-10 pt-6 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <Link
                    href={feat.ctaLink}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>{feat.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {feat.statusBadge && !feat.ctaText && !feat.stats && (
                <div className="relative z-10 pt-6 mt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Enterprise Standard</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {feat.statusBadge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
