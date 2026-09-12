'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Zap,
  HardDrive,
  BarChart3,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';
import { HardwareBenchmarkCategory } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu,
  zap: Zap,
  gpu: Zap,
  harddrive: HardDrive,
  storage: HardDrive,
  activity: Activity,
  layers: Layers,
  barchart: BarChart3
};

interface LiveStatsAndBenchmarksProps {
  benchmarks?: HardwareBenchmarkCategory[];
}

export function LiveStatsAndBenchmarks({ benchmarks = [] }: LiveStatsAndBenchmarksProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return null;
  }

  const [activeCategory, setActiveCategory] = useState<string>(benchmarks[0]?.id || '');
  const current = benchmarks.find(b => b.id === activeCategory) || benchmarks[0];
  if (!current) return null;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Hardware Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Verified Performance & Benchmarks
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Independent laboratory metrics to help you select the exact hardware stack for your compute workloads.
        </p>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {benchmarks.map(b => {
            const Icon = ICON_MAP[b.iconName?.toLowerCase() || ''] || ICON_MAP[b.id?.toLowerCase() || ''] || Cpu;
            const isActive = b.id === activeCategory;
            return (
              <button
                key={b.id}
                onClick={() => setActiveCategory(b.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-tech-blue text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>

        {/* Benchmark Visualizer Bars */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <h3 className="font-black text-slate-900 dark:text-white">{current.title}</h3>
            <span className="font-mono text-slate-400 text-[11px]">{current.metric}</span>
          </div>

          <div className="space-y-3.5">
            {current.benchmarks.map((item, idx) => {
              const percent = Math.round((item.score / item.maxScore) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                      {item.isTop && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-tech-blue/10 text-tech-blue dark:text-tech-cyan border border-tech-blue/30 shrink-0">
                          {item.badge || 'Leader'}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white shrink-0 ml-2">
                      {item.score.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.isTop
                          ? 'bg-gradient-to-r from-tech-blue to-tech-cyan'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Note Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>🔬 {current.note}</span>
            <Link
              href="/products"
              className="font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1"
            >
              <span>Explore Top Benchmarked SKUs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
