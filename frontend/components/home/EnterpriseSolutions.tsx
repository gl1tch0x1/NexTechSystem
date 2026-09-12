'use client';

import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Server,
  Network,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Activity,
  Gauge
} from 'lucide-react';
import { EnterpriseSolution } from '@/types';

interface EnterpriseSolutionsProps {
  solutions?: EnterpriseSolution[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  BrainCircuit,
  Server,
  Network,
  Cpu,
  Zap,
  Layers
};

export function EnterpriseSolutions({ solutions }: EnterpriseSolutionsProps) {
  if (!solutions || solutions.length === 0) {
    return null;
  }

  const displaySolutions = solutions;

  return (
    <section className="space-y-6">
      {/* Section Header (Ant Design Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <Layers className="w-4 h-4" />
            <span>Architecture Blueprints</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tailored Enterprise Computing Solutions
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Pre-validated hardware stacks engineered for high uptime, thermal efficiency, and immediate GCC deployment.
        </p>
      </div>

      {/* 3 Solutions Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {displaySolutions.map(sol => {
          const Icon = ICON_MAP[sol.iconName] || BrainCircuit;
          return (
            <div
              key={sol.id}
              className={`group relative rounded-3xl p-7 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 ${sol.borderColor || 'hover:border-tech-blue/50'} hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1`}
            >
              {/* Background Ambient Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${sol.glowColor || 'from-blue-600/10 to-transparent'} pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 space-y-4">
                {/* Top Card Bar */}
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-tech-blue/10 text-tech-blue dark:text-tech-cyan group-hover:bg-tech-blue group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${sol.badgeColor || 'bg-tech-blue/10 border-tech-blue/30 text-tech-blue'} shadow-xs`}>
                    {sol.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-tech-blue dark:group-hover:text-tech-cyan transition-colors leading-snug">
                    {sol.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {sol.description}
                  </p>
                </div>

                {/* Benchmark Tag */}
                {sol.benchmarkScore && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                    <span>{sol.benchmarkScore}</span>
                  </div>
                )}

                {/* Specs Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {sol.specs?.map((spec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Target SKU & Action */}
              <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Pre-Configured Architecture</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">{sol.popularSku}</div>
                  </div>
                  <div className="text-xs font-mono font-black text-tech-blue dark:text-tech-cyan shrink-0">
                    {sol.skuPrice}
                  </div>
                </div>

                <Link
                  href={sol.link}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-blue text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-2 group/btn shadow-xs"
                >
                  <span>Explore Architecture Blueprint</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
