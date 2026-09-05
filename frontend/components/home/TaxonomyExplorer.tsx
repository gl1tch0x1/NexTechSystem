'use client';

import React from 'react';
import Link from 'next/link';
import {
  Cpu,
  Zap,
  HardDrive,
  Server,
  Layers,
  Fan,
  BatteryCharging,
  Network,
  Monitor,
  Box,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Category } from '@/types';

interface TaxonomyExplorerProps {
  categories?: Category[];
}

const TAXONOMY_TILES = [
  { id: 'cpu', name: 'Desktop & Server CPUs', count: 'Intel Core & Xeon, AMD EPYC', icon: Cpu, href: '/products?category=processors', color: 'from-blue-600/20 to-cyan-500/20 text-tech-blue dark:text-tech-cyan' },
  { id: 'gpu', name: 'Graphics Accelerators', count: 'RTX 4090, RTX Ada, Radeon', icon: Zap, href: '/products?category=graphics-cards', color: 'from-purple-600/20 to-pink-500/20 text-purple-600 dark:text-purple-400' },
  { id: 'servers', name: 'Rackmount Servers', count: '1U/2U Dell & Supermicro', icon: Server, href: '/products?category=servers', color: 'from-indigo-600/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400' },
  { id: 'storage', name: 'PCIe Gen5 NVMe SSDs', count: 'Samsung 990 PRO, Crucial', icon: HardDrive, href: '/products?category=storage', color: 'from-cyan-600/20 to-emerald-500/20 text-cyan-600 dark:text-cyan-400' },
  { id: 'memory', name: 'DDR5 & ECC Registered RAM', count: 'Kingston, Corsair, G.Skill', icon: Layers, href: '/products?category=memory', color: 'from-emerald-600/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400' },
  { id: 'motherboards', name: 'Enterprise Motherboards', count: 'Z790, X670E, WRX90', icon: Box, href: '/products?category=motherboards', color: 'from-amber-600/20 to-orange-500/20 text-amber-600 dark:text-amber-400' },
  { id: 'networking', name: '100GbE Switching & PoE+', count: 'Cisco Catalyst, Ubiquiti', icon: Network, href: '/products?category=networking', color: 'from-sky-600/20 to-blue-500/20 text-sky-600 dark:text-sky-400' },
  { id: 'cooling', name: 'Liquid Cooling & PSUs', count: '360mm AIOs, Titanium 1600W', icon: Fan, href: '/products?category=power-cooling', color: 'from-rose-600/20 to-red-500/20 text-rose-600 dark:text-rose-400' },
];

export function TaxonomyExplorer({ categories }: TaxonomyExplorerProps) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <Layers className="w-4 h-4" />
            <span>Hardware Taxonomy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Hardware by Category
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs font-black text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1 self-start md:self-auto"
        >
          <span>View Complete Catalog Taxonomy</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Taxonomy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TAXONOMY_TILES.map(tile => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.id}
              href={tile.href}
              className="group relative p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue/50 dark:hover:border-tech-cyan/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-tech-blue group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-tech-blue dark:group-hover:text-tech-cyan transition-colors">
                  {tile.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-mono">
                  {tile.count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
