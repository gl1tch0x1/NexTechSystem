'use client';

import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Server,
  Network,
  CheckCircle2,
  ArrowRight,
  Zap,
  Cpu,
  Layers,
  Activity
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tailored Enterprise Computing Solutions
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Pre-validated hardware stacks engineered for high uptime, thermal efficiency, and immediate GCC deployment.
        </p>
      </div>

      {/* 3 Solutions Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {displaySolutions.map(sol => {
          const Icon = ICON_MAP[sol.iconName] || BrainCircuit;
          return (
            <div
              key={sol.id}
              className={`group relative rounded-2xl p-5 sm:p-6 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 ${sol.borderColor || 'hover:border-blue-500/50'} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-0.5`}
            >
              {/* Background Ambient Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${sol.glowColor || 'from-blue-600/10 to-transparent'} pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 space-y-3.5">
                {/* Top Card Bar */}
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${sol.badgeColor || 'bg-blue-50/80 border-blue-200/60 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800/50 dark:text-cyan-400'} shadow-2xs`}>
                    {sol.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                    {sol.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {sol.description}
                  </p>
                </div>

                {/* Benchmark Tag */}
                {sol.benchmarkScore && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                    <Activity className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>{sol.benchmarkScore}</span>
                  </div>
                )}

                {/* Specs Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {sol.specs?.map((spec, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug text-xs">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Target SKU & Action */}
              <div className="relative z-10 pt-4 mt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-2xs">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Pre-Configured Architecture</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{sol.popularSku}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400 shrink-0">
                    {sol.skuPrice}
                  </div>
                </div>

                <Link
                  href={sol.link}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 group/btn shadow-2xs"
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
