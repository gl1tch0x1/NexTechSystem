'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, PCBuilderCompatibilityResult, CompatibilityIssue } from '@/types';
import { useCart } from '@/lib/cart-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Plus,
  Trash2,
  Layers,
  Zap,
  HardDrive,
  Monitor,
  Fan,
  Box,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

interface ComponentSlots {
  cpu: Product | null;
  motherboard: Product | null;
  ram: Product | null;
  gpu: Product | null;
  storage: Product | null;
  psu: Product | null;
  case: Product | null;
  cooler: Product | null;
}

const SLOT_CONFIG: Array<{ key: keyof ComponentSlots; label: string; icon: any; placeholder: string }> = [
  { key: 'cpu', label: '1. Processor (CPU)', icon: Cpu, placeholder: 'Select Intel Core i9 or AMD Ryzen Processor' },
  { key: 'motherboard', label: '2. Motherboard', icon: Layers, placeholder: 'Select LGA1700 or AM5 Compatible Motherboard' },
  { key: 'ram', label: '3. Memory (RAM)', icon: Zap, placeholder: 'Select DDR5 or DDR4 High-Speed Kit' },
  { key: 'gpu', label: '4. Graphics Card (GPU)', icon: Monitor, placeholder: 'Select NVIDIA RTX 4090 or Dedicated GPU' },
  { key: 'storage', label: '5. Primary Storage (NVMe SSD)', icon: HardDrive, placeholder: 'Select PCIe 4.0/5.0 M.2 SSD' },
  { key: 'psu', label: '6. Power Supply (PSU)', icon: Zap, placeholder: 'Select 850W-1000W 80+ Gold Modular PSU' },
  { key: 'case', label: '7. Chassis / Case', icon: Box, placeholder: 'Select Dual-Chamber or Mid-Tower ATX Case' },
  { key: 'cooler', label: '8. CPU Cooler', icon: Fan, placeholder: 'Select 360mm AIO Liquid or Tower Cooler' },
];

export default function PCBuilderPage() {
  const { addBundleToCart } = useCart();
  const [componentsCatalog, setComponentsCatalog] = useState<Record<string, Product[]>>({});
  const [slots, setSlots] = useState<ComponentSlots>({
    cpu: null,
    motherboard: null,
    ram: null,
    gpu: null,
    storage: null,
    psu: null,
    case: null,
    cooler: null,
  });
  const [activeModalSlot, setActiveModalSlot] = useState<keyof ComponentSlots | null>(null);
  const [compatibility, setCompatibility] = useState<PCBuilderCompatibilityResult>({
    isCompatible: true,
    totalEstimatedWattage: 75,
    recommendedPsuWattage: 650,
    issues: [],
    totalPrice: 0,
  });
  const [bundleAdded, setBundleAdded] = useState(false);

  // Fetch categorized hardware
  useEffect(() => {
    ApiClient.get<Record<string, Product[]>>('/pc-builder/components')
      .then(data => setComponentsCatalog(data))
      .catch(err => console.error('Failed to load PC Builder components:', err));
  }, []);

  // Recalculate compatibility whenever slots change
  useEffect(() => {
    ApiClient.post<PCBuilderCompatibilityResult>('/pc-builder/validate', { slots })
      .then(res => setCompatibility(res))
      .catch(err => console.error('Validation error:', err));
  }, [slots]);

  const handleSelectComponent = (slotKey: keyof ComponentSlots, product: Product) => {
    setSlots(prev => ({ ...prev, [slotKey]: product }));
    setActiveModalSlot(null);
  };

  const handleRemoveComponent = (slotKey: keyof ComponentSlots) => {
    setSlots(prev => ({ ...prev, [slotKey]: null }));
  };

  const handleResetBuild = () => {
    setSlots({
      cpu: null,
      motherboard: null,
      ram: null,
      gpu: null,
      storage: null,
      psu: null,
      case: null,
      cooler: null,
    });
  };

  const handleAddAllToCart = () => {
    const selectedProds = Object.values(slots).filter(Boolean) as Product[];
    if (selectedProds.length === 0) return;
    addBundleToCart(selectedProds);
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };

  const selectedCount = Object.values(slots).filter(Boolean).length;
  const errors = compatibility.issues.filter(i => i.type === 'ERROR');
  const warnings = compatibility.issues.filter(i => i.type === 'WARNING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-blue/10 text-tech-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Hardware Compatibility Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Custom PC Builder Configurator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build with real-time socket matching, DDR generation, and wattage validation.
          </p>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={handleResetBuild}
            className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Custom Build
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Slot Selectors */}
        <div className="lg:col-span-8 space-y-4">
          {SLOT_CONFIG.map(({ key, label, icon: Icon, placeholder }) => {
            const product = slots[key];

            return (
              <div
                key={key}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-tech-card border transition-all ${
                  product
                    ? 'border-tech-blue/40 shadow-tech-sm'
                    : 'border-slate-200 dark:border-tech-slate hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        product
                          ? 'bg-tech-blue text-white'
                          : 'bg-slate-100 dark:bg-tech-slate text-slate-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                      {product ? (
                        <div className="space-y-0.5">
                          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                            <span>SKU: {product.sku}</span>
                            {product.specifications?.socket && (
                              <span className="bg-slate-100 dark:bg-tech-slate px-1.5 py-0.5 rounded text-[10px] text-tech-cyan">
                                {product.specifications.socket}
                              </span>
                            )}
                            {product.specifications?.wattage && (
                              <span className="bg-slate-100 dark:bg-tech-slate px-1.5 py-0.5 rounded text-[10px] text-amber-400">
                                {product.specifications.wattage}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-medium italic mt-0.5">{placeholder}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    {product ? (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(product.salePrice || product.price, product.currency)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveComponent(key)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove component"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setActiveModalSlot(key)}
                        className="px-4 py-2 bg-tech-blue/10 hover:bg-tech-blue hover:text-white text-tech-blue dark:text-tech-cyan text-xs font-bold rounded-xl border border-tech-blue/30 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Choose Hardware</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sticky Summary & Compatibility Diagnostics Panel */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Compatibility Status Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-tech-card border border-slate-200 dark:border-tech-slate space-y-6 shadow-tech">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Real-Time Validation Matrix
              </div>
              {errors.length > 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-black text-sm">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>Incompatible Configuration</span>
                </div>
              ) : warnings.length > 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 font-black text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Compatible with Headroom Warning</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>100% Component Compatibility Verified</span>
                </div>
              )}
            </div>

            {/* Diagnostic Issues List */}
            {compatibility.issues.length > 0 && (
              <div className="space-y-2">
                {compatibility.issues.map((iss, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      iss.type === 'ERROR'
                        ? 'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200/50'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50'
                    }`}
                  >
                    <strong>{iss.type}: </strong> {iss.message}
                  </div>
                ))}
              </div>
            )}

            {/* Power & Wattage Diagnostics */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-tech-slate">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Peak System Wattage:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  ~{compatibility.totalEstimatedWattage}W
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Recommended PSU Wattage:</span>
                <span className="font-mono font-bold text-tech-cyan">
                  {compatibility.recommendedPsuWattage}W+
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Selected Components:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedCount} / 8</span>
              </div>
            </div>

            {/* Total Build Price */}
            <div className="pt-4 border-t border-slate-100 dark:border-tech-slate">
              <div className="text-xs text-slate-400">Estimated Total Build Cost</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatPrice(compatibility.totalPrice)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Includes 5% UAE VAT & components warranty</div>
            </div>

            {/* 1-Click Add Complete Build to Cart Button */}
            <button
              disabled={selectedCount === 0 || errors.length > 0}
              onClick={handleAddAllToCart}
              className={`w-full py-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedCount === 0 || errors.length > 0
                  ? 'bg-slate-200 dark:bg-tech-slate text-slate-400 cursor-not-allowed'
                  : 'bg-tech-blue text-white hover:bg-blue-600 shadow-tech-glow'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {bundleAdded ? '✓ Complete Build Added to Cart!' : 'Add Complete Build to Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Component Selection Modal */}
      {activeModalSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-tech-dark w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-tech-slate max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-tech-slate">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Select {SLOT_CONFIG.find(s => s.key === activeModalSlot)?.label}
                </h3>
                <p className="text-xs text-slate-400">Choose compatible hardware from available inventory</p>
              </div>
              <button
                onClick={() => setActiveModalSlot(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(componentsCatalog[activeModalSlot] || []).map(product => (
                <div
                  key={product.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-tech-slate/40 border border-slate-200/80 dark:border-tech-slate hover:border-tech-blue flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=200&q=80'}
                      alt={product.name}
                      className="w-14 h-14 object-contain bg-white dark:bg-tech-dark p-1 rounded-xl"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-tech-blue uppercase">{product.brandName}</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {product.specifications?.socket && <span>Socket: {product.specifications.socket}</span>}
                        {product.specifications?.ramType && <span>RAM: {product.specifications.ramType}</span>}
                        {product.specifications?.wattage && <span>TDP: {product.specifications.wattage}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatPrice(product.salePrice || product.price, product.currency)}
                    </div>
                    <button
                      onClick={() => handleSelectComponent(activeModalSlot, product)}
                      className="px-3.5 py-1.5 bg-tech-blue text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}

              {(!componentsCatalog[activeModalSlot] || componentsCatalog[activeModalSlot].length === 0) && (
                <div className="text-center py-10 text-xs text-slate-400">
                  No matching components found in catalog for this slot.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
