'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import {
  Cpu,
  Server,
  HardDrive,
  Monitor,
  Zap,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface HardwareMatrixShowcaseProps {
  products: Product[];
}

export function HardwareMatrixShowcase({ products }: HardwareMatrixShowcaseProps) {
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const tabs = [
    { id: 'ALL', label: 'All Flagships', icon: Sparkles },
    { id: 'CPU', label: 'Processors (CPUs)', icon: Cpu },
    { id: 'GPU', label: 'Graphics (GPUs)', icon: Zap },
    { id: 'SERVER', label: 'Servers & PoE', icon: Server },
    { id: 'STORAGE', label: 'NVMe Gen5 Storage', icon: HardDrive },
  ];

  const filteredProducts = products.filter(p => {
    if (activeTab === 'ALL') return true;
    const name = (p.name || '').toLowerCase();
    const cat = (p.categoryName || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();

    if (activeTab === 'CPU') return cat.includes('component') && (name.includes('core') || name.includes('ryzen') || name.includes('cpu') || name.includes('intel') || name.includes('amd'));
    if (activeTab === 'GPU') return name.includes('rtx') || name.includes('geforce') || name.includes('gpu') || name.includes('radeon');
    if (activeTab === 'SERVER') return cat.includes('server') || cat.includes('network') || name.includes('server') || name.includes('poweredge') || name.includes('switch') || name.includes('cisco');
    if (activeTab === 'STORAGE') return cat.includes('storage') || name.includes('ssd') || name.includes('nvme') || name.includes('990 pro') || name.includes('crucial');
    return true;
  });

  const displayList = filteredProducts.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Ant Design / Shadcn Segmented Tab Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeTab === id ? 'text-tech-blue dark:text-tech-cyan' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Action Link */}
        <Link
          href="/products"
          className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1 self-end md:self-auto"
        >
          <span>View All {products.length} Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayList.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
