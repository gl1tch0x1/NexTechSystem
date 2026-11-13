'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cpu,
  Zap,
  HardDrive,
  Server,
  Layers,
  Fan,
  Network,
  Monitor,
  Box,
  Laptop,
  Keyboard,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Category } from '@/types';

interface TaxonomyExplorerProps {
  categories?: Category[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cpu: Cpu,
  zap: Zap,
  harddrive: HardDrive,
  server: Server,
  layers: Layers,
  fan: Fan,
  network: Network,
  monitor: Monitor,
  box: Box,
  laptop: Laptop,
  keyboard: Keyboard,
};

const COLOR_PALETTES = [
  'bg-blue-50 dark:bg-blue-950/60 text-tech-blue dark:text-tech-cyan border border-blue-200/60 dark:border-blue-900/40',
  'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40',
  'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-900/40',
  'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40',
  'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40',
  'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40',
  'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800',
];

export function TaxonomyExplorer({ categories = [] }: TaxonomyExplorerProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const getCategoryIcon = (cat: Category) => {
    if (cat.icon && CATEGORY_ICONS[cat.icon.toLowerCase()]) {
      return CATEGORY_ICONS[cat.icon.toLowerCase()];
    }
    const name = (cat.name || '').toLowerCase();
    if (name.includes('processor') || name.includes('cpu')) return Cpu;
    if (name.includes('graphics') || name.includes('gpu')) return Zap;
    if (name.includes('server')) return Server;
    if (name.includes('storage') || name.includes('nvme') || name.includes('ssd')) return HardDrive;
    if (name.includes('memory') || name.includes('ram')) return Layers;
    if (name.includes('motherboard')) return Box;
    if (name.includes('network')) return Network;
    if (name.includes('laptop')) return Laptop;
    if (name.includes('monitor') || name.includes('display')) return Monitor;
    if (name.includes('accessor')) return Keyboard;
    return Box;
  };

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

      {/* Grid of Dynamic Category Cards from Database */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.06,
            },
          },
        }}
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {categories.slice(0, 8).map((cat, idx) => {
          const Icon = getCategoryIcon(cat);
          const colorClass = COLOR_PALETTES[idx % COLOR_PALETTES.length];
          const productCountText = cat.productCount !== undefined
            ? `${cat.productCount} verified products`
            : cat.description || 'Enterprise grade';

          return (
            <motion.div
              key={cat.id}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <Link
                href={`/products?category=${cat.id}`}
                className="group relative p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue/50 dark:hover:border-tech-cyan/50 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between space-y-3 sm:space-y-4 overflow-hidden h-full"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-tech-blue group-hover:text-white flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-tech-blue dark:group-hover:text-tech-cyan transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-mono">
                    {productCountText}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
