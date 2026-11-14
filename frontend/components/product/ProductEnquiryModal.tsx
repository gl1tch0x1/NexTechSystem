'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  AlertCircle,
  Cpu,
  HardDrive,
  Hash,
  PackageX,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { Product } from '@/types';
import {
  extractProductConfigurations,
  ProductConfigurations
} from '@/lib/product-availability';
import { generateWhatsAppClickUrl } from '@/lib/whatsapp';
import { useStoreSettings } from '@/lib/use-store-settings';

export interface ProductEnquiryModalProps {
  isOpen: boolean;
  product: Product;
  initialRam?: string;
  initialStorage?: string;
  initialQuantity?: number;
  onClose: () => void;
}

export function ProductEnquiryModal({
  isOpen,
  product,
  initialRam,
  initialStorage,
  initialQuantity = 1,
  onClose,
}: ProductEnquiryModalProps) {
  const { whatsappNumber: dbWhatsApp, supportPhone } = useStoreSettings();

  const [configs, setConfigs] = useState<ProductConfigurations>({
    hasRam: false,
    hasStorage: false,
    availableRam: [],
    availableStorage: [],
    ramToStorageMap: {},
  });

  const [selectedRam, setSelectedRam] = useState<string | undefined>(undefined);
  const [selectedStorage, setSelectedStorage] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [validationError, setValidationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize configurations, RAM, Storage, and Quantity whenever modal opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      const extracted = extractProductConfigurations(product);
      setConfigs(extracted);

      // Determine starting RAM
      let startRam: string | undefined = undefined;
      if (extracted.hasRam) {
        if (initialRam && extracted.availableRam.includes(initialRam)) {
          startRam = initialRam;
        } else if (extracted.defaultRam) {
          startRam = extracted.defaultRam;
        } else {
          startRam = extracted.availableRam[0];
        }
      }
      setSelectedRam(startRam);

      // Determine starting Storage based on starting RAM (Phase 4 Dependency)
      let startStorage: string | undefined = undefined;
      if (extracted.hasStorage) {
        const validStorages = startRam && extracted.ramToStorageMap[startRam] && extracted.ramToStorageMap[startRam].length > 0
          ? extracted.ramToStorageMap[startRam]
          : extracted.availableStorage;

        if (initialStorage && validStorages.includes(initialStorage)) {
          startStorage = initialStorage;
        } else if (validStorages.length > 0) {
          startStorage = validStorages[0];
        } else {
          startStorage = extracted.defaultStorage || extracted.availableStorage[0];
        }
      }
      setSelectedStorage(startStorage);

      const startingQty = Math.max(1, Math.floor(initialQuantity || 1));
      setQuantity(startingQty);
      setQuantityInput(String(startingQty));
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [isOpen, product, initialRam, initialStorage, initialQuantity]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Valid storage options for currently selected RAM (Phase 4 Dependency enforcement)
  const currentValidStorages = useMemo(() => {
    if (!configs.hasStorage) return [];
    if (selectedRam && configs.ramToStorageMap[selectedRam] && configs.ramToStorageMap[selectedRam].length > 0) {
      return configs.ramToStorageMap[selectedRam];
    }
    return configs.availableStorage;
  }, [configs, selectedRam]);

  // When RAM selection changes, synchronize valid storage options
  const handleRamSelect = (ram: string) => {
    setSelectedRam(ram);
    if (configs.hasStorage) {
      const validForRam = configs.ramToStorageMap[ram] || configs.availableStorage;
      if (!selectedStorage || !validForRam.includes(selectedStorage)) {
        setSelectedStorage(validForRam[0]);
      }
    }
  };

  const handleQuantityInputChange = (val: string) => {
    setQuantityInput(val);
    setValidationError('');

    const parsed = parseInt(val, 10);
    if (!val.trim()) {
      setValidationError('Please enter a valid quantity (minimum 1).');
      return;
    }

    if (isNaN(parsed) || parsed < 1 || String(parsed) !== val.trim()) {
      setValidationError('Quantity must be a positive whole number (minimum 1).');
      return;
    }

    setQuantity(parsed);
  };

  const handleStepQuantity = (delta: number) => {
    const nextVal = Math.max(1, quantity + delta);
    setQuantity(nextVal);
    setQuantityInput(String(nextVal));
    setValidationError('');
  };

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedQty = parseInt(quantityInput, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      setValidationError('Please specify a valid quantity of 1 or more.');
      return;
    }

    setIsSubmitting(true);

    const contactPhone =
      (product as any)?.contactWhatsApp ||
      dbWhatsApp ||
      supportPhone ||
      '';

    const whatsappUrl = generateWhatsAppClickUrl({
      productName: product.name,
      ram: configs.hasRam ? selectedRam : undefined,
      storage: configs.hasStorage ? selectedStorage : undefined,
      quantity: parsedQty,
      phone: contactPhone,
    });

    // Open WhatsApp in a new tab/window safely
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const productImage =
    product.thumbnail ||
    product.images?.[0] ||
    '/images/intel_i9_14900k.jpg';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquiry-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="enquiry-modal-title"
                    className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-white"
                  >
                    Product Availability Enquiry
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Direct WhatsApp dispatch & restock confirmation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Close enquiry form"
                aria-label="Close enquiry form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="px-4 sm:px-5 pt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3.5">
                <div className="relative w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <img
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/80 dark:border-rose-900/60 inline-flex items-center gap-1">
                      <PackageX className="w-3 h-3" />
                      <span>Sold Out / Out of Stock</span>
                    </span>
                    {product.brandName && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {product.brandName}
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    SKU: <span className="font-mono text-slate-700 dark:text-slate-300">{product.sku}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enquiry Form */}
            <form onSubmit={handleSubmitEnquiry} className="p-4 sm:p-5 space-y-4">
              {/* Field 1: Product Name (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Product Name</span>
                  <span className="text-[10px] font-mono text-slate-400">Auto-populated</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={product.name}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-not-allowed select-all"
                  title="Product Name is read-only"
                />
              </div>

              {/* Field 2: RAM Configuration (Shown ONLY if applicable) */}
              {configs.hasRam && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
                      <span>RAM / Memory</span>
                    </span>
                    {configs.availableRam.length === 1 ? (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Fixed Specification</span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">Choose Option</span>
                    )}
                  </label>

                  {configs.availableRam.length > 1 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {configs.availableRam.map((ramOpt) => {
                        const isSelected = selectedRam === ramOpt;
                        return (
                          <button
                            key={ramOpt}
                            type="button"
                            onClick={() => handleRamSelect(ramOpt)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                              isSelected
                                ? 'bg-tech-blue text-white border-tech-blue shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                            }`}
                            title={ramOpt}
                          >
                            {ramOpt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-mono">{configs.availableRam[0]}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              )}

              {/* Field 3: Storage Configuration (Shown ONLY if applicable) */}
              {configs.hasStorage && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
                      <span>Storage / Capacity</span>
                    </span>
                    {currentValidStorages.length === 1 ? (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {configs.hasRam && configs.availableRam.length > 1 ? 'Variant Linked' : 'Fixed Specification'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">Choose Option</span>
                    )}
                  </label>

                  {currentValidStorages.length > 1 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {currentValidStorages.map((storageOpt) => {
                        const isSelected = selectedStorage === storageOpt;
                        return (
                          <button
                            key={storageOpt}
                            type="button"
                            onClick={() => setSelectedStorage(storageOpt)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                              isSelected
                                ? 'bg-tech-blue text-white border-tech-blue shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                            }`}
                            title={storageOpt}
                          >
                            {storageOpt}
                          </button>
                        );
                      })}
                    </div>
                  ) : currentValidStorages.length === 1 ? (
                    <div className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-mono">{currentValidStorages[0]}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Field 4: Required Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
                    <span>Required Quantity</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Minimum 1 Unit</span>
                </label>

                <div className="flex items-center gap-3">
                  {/* Stepper Controls */}
                  <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(-1)}
                      disabled={quantity <= 1}
                      className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantityInput}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      className="w-14 text-center text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(1)}
                      className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Enter the exact unit count you require for individual, corporate, or bulk allocation.
                  </div>
                </div>

                {/* Validation Error Message */}
                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Trust Information */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Our enterprise sales team typically confirms warehouse allocation, expected container arrival dates, and corporate quotation within minutes during UAE business hours.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !!validationError}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Opening WhatsApp...' : 'Continue to WhatsApp'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
