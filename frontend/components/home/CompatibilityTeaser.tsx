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

interface CompatibilityTeaserProps {
  presets?: BuilderPreset[];
}

export function CompatibilityTeaser({ presets = [] }: CompatibilityTeaserProps) {
  if (!presets || presets.length === 0) {
    return null;
  }

  const activePresets = presets;
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activePresets[0]?.id || '');
  const preset = activePresets.find(p => p.id === selectedPresetId) || activePresets[0];
  if (!preset) return null;

  const wattagePercentage = Math.round((preset.estTotalWatts / preset.psuWatts) * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0A0F1D] to-[#050811] text-white p-5 sm:p-10 border border-slate-800 shadow-2xl">
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
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
            <Link
              href="/pc-builder"
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 text-center"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Custom PC Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/compare"
              className="px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 text-center"
            >
              <Layers className="w-4 h-4 text-tech-cyan" />
              <span>Compare Specs Side-by-Side</span>
            </Link>
          </div>
        </div>

        {/* Right Dynamic Live Telemetry & Wattage Gauge Card */}
        <div className="lg:col-span-5 bg-slate-950/90 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 sm:space-y-5 font-mono text-xs">
          {/* Card Top Title */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs truncate mr-2">
              <Gauge className="w-4 h-4 text-tech-cyan shrink-0" />
              <span className="truncate">LIVE POWER HUD</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] sm:text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          </div>

          {/* Architecture Spec Breakdown */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-slate-400 text-[11px] shrink-0">CPU Processor</span>
              <span className="text-white font-bold truncate text-right">{preset.cpu}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-slate-400 text-[11px] shrink-0">GPU Accelerator</span>
              <span className="text-purple-300 font-bold truncate text-right">{preset.gpu}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-slate-400 text-[11px] shrink-0">Socket & Bus</span>
              <span className="text-tech-cyan font-bold truncate text-right">{preset.socket}</span>
            </div>
          </div>

          {/* Ant Design Power Budget Progress Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Estimated Peak:</span>
              <span className="text-white font-bold">{preset.estTotalWatts}W / {preset.psuWatts}W PSU</span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-tech-cyan to-purple-500 transition-all duration-500"
                style={{ width: `${wattagePercentage}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400 pt-0.5">
              <span>{wattagePercentage}% Capacity</span>
              <span className="text-emerald-400 font-bold">+{preset.headroomPercent}% Headroom (Optimal)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
