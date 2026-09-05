'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Flame,
  Layers,
  Sparkles,
  Gauge
} from 'lucide-react';
import { BuilderPreset } from '@/types';

const FALLBACK_PRESETS: BuilderPreset[] = [
  {
    id: 'ai-extreme',
    name: 'AI & Deep Learning Station',
    socket: 'LGA1700 (Z790)',
    cpu: 'Intel Core i9-14900K (24C/32T)',
    gpu: 'NVIDIA RTX 4090 24GB GDDR6X',
    ram: '64GB DDR5 6000MHz CL30',
    psuWatts: 1200,
    estTotalWatts: 740,
    headroomPercent: 38,
    order: 1,
    isActive: true,
  },
  {
    id: 'render-studio',
    name: '3D CAD & Unreal Engine Rig',
    socket: 'AM5 (X670E)',
    cpu: 'AMD Ryzen 9 7950X (16C/32T)',
    gpu: 'NVIDIA RTX 4080 Super 16GB',
    ram: '32GB DDR5 6000MHz Low-Latency',
    psuWatts: 1000,
    estTotalWatts: 580,
    headroomPercent: 42,
    order: 2,
    isActive: true,
  },
  {
    id: 'enterprise-node',
    name: 'Virtualization & High-TDP Node',
    socket: 'LGA4677 Xeon',
    cpu: 'Intel Xeon Platinum 8480+ (56C)',
    gpu: 'NVIDIA RTX A6000 48GB ECC',
    ram: '128GB DDR5 ECC Registered',
    psuWatts: 1600,
    estTotalWatts: 980,
    headroomPercent: 39,
    order: 3,
    isActive: true,
  }
];

interface CompatibilityTeaserProps {
  presets?: BuilderPreset[];
}

export function CompatibilityTeaser({ presets = [] }: CompatibilityTeaserProps) {
  const activePresets = (presets && presets.length > 0) ? presets : FALLBACK_PRESETS;
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activePresets[0]?.id || 'ai-extreme');
  const preset = activePresets.find(p => p.id === selectedPresetId) || activePresets[0] || FALLBACK_PRESETS[0];

  const wattagePercentage = Math.round((preset.estTotalWatts / preset.psuWatts) * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0A0F1D] to-[#050811] text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-tech-blue/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Interactive Narrative */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Verification Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Intelligent PC Builder Studio with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-tech-cyan to-blue-400">
              Zero-Defect Socket & TDP Headroom Guard
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
            Never second-guess hardware compatibility. Our built-in validation engine dynamically matches CPU socket pinouts, RAM slot clearances, motherboard VRM phases, and power supply wattage headroom before you order.
          </p>

          {/* Interactive Preset Buttons (Ant Design Segmented Picker) */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Explore Pre-Validated Architecture Presets:
            </div>
            <div className="flex flex-wrap gap-2">
              {activePresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPresetId(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    p.id === selectedPresetId
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/pc-builder"
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Custom PC Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/compare"
              className="px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-tech-cyan" />
              <span>Compare Specs Side-by-Side</span>
            </Link>
          </div>
        </div>

        {/* Right Dynamic Live Telemetry & Wattage Gauge Card */}
        <div className="lg:col-span-5 bg-slate-950/90 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 font-mono text-xs">
          {/* Card Top Title */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
              <Gauge className="w-4 h-4 text-tech-cyan" />
              <span>LIVE POWER & COMPATIBILITY HUD</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED 100%
            </span>
          </div>

          {/* Architecture Spec Breakdown */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">CPU Processor</span>
              <span className="text-white font-bold truncate max-w-[200px] text-right">{preset.cpu}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">GPU Accelerator</span>
              <span className="text-purple-300 font-bold truncate max-w-[200px] text-right">{preset.gpu}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Socket & Bus</span>
              <span className="text-tech-cyan font-bold">{preset.socket}</span>
            </div>
          </div>

          {/* Ant Design Power Budget Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Estimated Peak Draw:</span>
              <span className="text-white font-bold">{preset.estTotalWatts}W / {preset.psuWatts}W PSU</span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-tech-cyan to-purple-500 transition-all duration-500"
                style={{ width: `${wattagePercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>{wattagePercentage}% PSU Capacity Used</span>
              <span className="text-emerald-400 font-bold">+{preset.headroomPercent}% Thermal Headroom (Optimal)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
