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

const FALLBACK_BENCHMARKS: HardwareBenchmarkCategory[] = [
  {
    id: 'cpu',
    label: 'CPU Multithread Compute',
    iconName: 'cpu',
    title: 'Cinebench 2024 Multi-Core Rendering Benchmark',
    metric: 'Points (Higher is Better)',
    benchmarks: [
      { name: 'Intel Core i9-14900K (24C/32T 6.0GHz)', score: 2280, maxScore: 2400, isTop: true, badge: 'Flagship' },
      { name: 'AMD Ryzen 9 7950X (16C/32T 5.7GHz)', score: 2160, maxScore: 2400 },
      { name: 'Intel Core i7-14700K (20C/28T 5.6GHz)', score: 1940, maxScore: 2400 },
      { name: 'Intel Core i9-13900K (24C/32T 5.8GHz)', score: 2190, maxScore: 2400 },
    ],
    note: 'Tested on Z790 motherboard with 64GB DDR5-6000MHz memory and 360mm liquid AIO.',
    order: 1,
    isActive: true,
  },
  {
    id: 'gpu',
    label: 'GPU AI & 3D Rendering',
    iconName: 'zap',
    title: '3DMark TimeSpy Extreme Graphics Score',
    metric: 'Graphics Points (Higher is Better)',
    benchmarks: [
      { name: 'NVIDIA GeForce RTX 4090 24GB GDDR6X', score: 19850, maxScore: 21000, isTop: true, badge: '1st in Class' },
      { name: 'NVIDIA GeForce RTX 4080 Super 16GB', score: 14200, maxScore: 21000 },
      { name: 'NVIDIA GeForce RTX 4070 Ti Super 16GB', score: 11950, maxScore: 21000 },
      { name: 'NVIDIA GeForce RTX 3090 24GB (Previous Gen)', score: 10400, maxScore: 21000 },
    ],
    note: 'Direct 4K rasterization and ray-tracing performance tested with DLSS 3.5 frame gen.',
    order: 2,
    isActive: true,
  },
  {
    id: 'storage',
    label: 'NVMe Gen4/Gen5 Throughput',
    iconName: 'harddrive',
    title: 'Sequential Read Speed Benchmark (CrystalDiskMark)',
    metric: 'MB/s (Higher is Better)',
    benchmarks: [
      { name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', score: 7450, maxScore: 8000, isTop: true, badge: '7,450 MB/s' },
      { name: 'Crucial T500 2TB PCIe 4.0 NVMe', score: 7300, maxScore: 8000 },
      { name: 'Samsung 980 PRO 1TB PCIe 4.0 NVMe', score: 7000, maxScore: 8000 },
      { name: 'Standard SATA 2.5" SSD', score: 550, maxScore: 8000 },
    ],
    note: 'Direct PCIe Gen 4.0 x4 M.2 slot test on aluminum thermal heatsink.',
    order: 3,
    isActive: true,
  }
];

interface LiveStatsAndBenchmarksProps {
  benchmarks?: HardwareBenchmarkCategory[];
}

export function LiveStatsAndBenchmarks({ benchmarks = [] }: LiveStatsAndBenchmarksProps) {
  const activeBenchmarks = (benchmarks && benchmarks.length > 0) ? benchmarks : FALLBACK_BENCHMARKS;
  const [activeCategory, setActiveCategory] = useState<string>(activeBenchmarks[0]?.id || 'cpu');
  const current = activeBenchmarks.find(b => b.id === activeCategory) || activeBenchmarks[0] || FALLBACK_BENCHMARKS[0];

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
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {activeBenchmarks.map(b => {
            const Icon = ICON_MAP[b.iconName?.toLowerCase() || ''] || ICON_MAP[b.id?.toLowerCase() || ''] || Cpu;
            const isActive = b.id === activeCategory;
            return (
              <button
                key={b.id}
                onClick={() => setActiveCategory(b.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-black text-slate-900 dark:text-white">{current.title}</h3>
            <span className="font-mono text-slate-400 text-[11px]">{current.metric}</span>
          </div>

          <div className="space-y-3.5">
            {current.benchmarks.map((item, idx) => {
              const percent = Math.round((item.score / item.maxScore) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                      {item.isTop && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-tech-blue/10 text-tech-blue dark:text-tech-cyan border border-tech-blue/30">
                          {item.badge || 'Leader'}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
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
