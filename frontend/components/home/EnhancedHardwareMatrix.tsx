'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import {
  Cpu,
  Server,
  HardDrive,
  Zap,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  Search,
  SlidersHorizontal,
  Boxes,
  RotateCcw
} from 'lucide-react';

interface EnhancedHardwareMatrixProps {
  products: Product[];
}

export function EnhancedHardwareMatrix({ products }: EnhancedHardwareMatrixProps) {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('FEATURED');

  const tabs = [
    { id: 'ALL', label: 'All Catalog', icon: Sparkles },
    { id: 'CPU', label: 'Processors (CPUs)', icon: Cpu },
    { id: 'GPU', label: 'Graphics (GPUs)', icon: Zap },
    { id: 'SERVER', label: 'Servers & PoE', icon: Server },
    { id: 'STORAGE', label: 'Gen5 NVMe Storage', icon: HardDrive },
    { id: 'MEMORY', label: 'Motherboards & RAM', icon: Layers },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(p => {
        // Tab Filter
        const name = (p.name || '').toLowerCase();
        const cat = (p.categoryName || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const brand = (p.brandName || '').toLowerCase();

        if (activeTab === 'CPU') {
          const isCpu = (name.includes('core') || name.includes('ryzen') || name.includes('cpu') || name.includes('intel') || name.includes('amd') || name.includes('xeon')) && !name.includes('rtx') && !name.includes('geforce');
          if (!isCpu && !cat.includes('processor') && !cat.includes('cpu')) return false;
        } else if (activeTab === 'GPU') {
          const isGpu = name.includes('rtx') || name.includes('geforce') || name.includes('gpu') || name.includes('radeon') || cat.includes('graphic');
          if (!isGpu) return false;
        } else if (activeTab === 'SERVER') {
          const isServer = cat.includes('server') || cat.includes('network') || name.includes('server') || name.includes('poweredge') || name.includes('switch') || name.includes('cisco');
          if (!isServer) return false;
        } else if (activeTab === 'STORAGE') {
          const isStorage = cat.includes('storage') || name.includes('ssd') || name.includes('nvme') || name.includes('990 pro') || name.includes('crucial');
          if (!isStorage) return false;
        } else if (activeTab === 'MEMORY') {
          const isMem = cat.includes('memory') || cat.includes('motherboard') || name.includes('ddr5') || name.includes('ram') || name.includes('z790') || name.includes('x670');
          if (!isMem) return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match = name.includes(q) || sku.includes(q) || brand.includes(q) || cat.includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;

        if (sortBy === 'PRICE_ASC') return priceA - priceB;
        if (sortBy === 'PRICE_DESC') return priceB - priceA;
        if (sortBy === 'STOCK_DESC') return b.stock - a.stock;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, activeTab, searchQuery, sortBy]);

  const displayList = filteredAndSortedProducts.slice(0, 8);

  return (
    <section className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <Boxes className="w-4 h-4" />
            <span>Verified Stock Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Enterprise Hardware & Component Catalog
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Filtered by certified OEM supply chain, real-time GCC warehouse inventory, and spec compatibility.
        </p>
      </div>

      {/* Control Bar: Ant Design Segmented Tabs + Search + Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 max-w-full">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-tech-blue text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeTab === id ? 'text-white' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Search & Sort Widgets */}
        <div className="flex items-center gap-2.5 shrink-0 px-1">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-44 sm:w-56 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue dark:focus:border-tech-cyan"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
          >
            <option value="FEATURED">Featured First</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="STOCK_DESC">Highest Stock</option>
          </select>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {displayList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayList.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No components matched your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or switching to another category tab to view all available SKUs.
          </p>
          <button
            onClick={() => {
              setActiveTab('ALL');
              setSearchQuery('');
              setSortBy('FEATURED');
            }}
            className="px-4 py-2 rounded-xl bg-tech-blue text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Bottom CTA to Full Catalog */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing {displayList.length} of {filteredAndSortedProducts.length} matched enterprise components
        </div>

        <Link
          href="/products"
          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <span>Open Full Hardware Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
