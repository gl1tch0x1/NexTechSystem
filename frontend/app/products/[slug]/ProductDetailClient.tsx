'use client';

import { useState, useMemo } from 'react';
import { Product, ProductVariant } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { useStoreSettings } from '@/lib/use-store-settings';
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  Zap,
  MessageCircle,
  Mail,
  AlertTriangle,
  PackageX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BnplPromoBadge from '@/components/checkout/BnplPromoBadge';
import { useProductEnquiry } from '@/lib/product-enquiry-context';
import { getProductAvailability, extractStorageConfigurations } from '@/lib/product-availability';

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0] || product.thumbnail || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const hasVariants = Boolean(product.hasVariants && product.variants && product.variants.length > 0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants && product.variants ? product.variants[0] : null
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    hasVariants && product.variants?.[0]?.options ? { ...product.variants[0].options } : {}
  );

  const optionDefinitions = useMemo(() => {
    if (product.variantOptions && product.variantOptions.length > 0) {
      return product.variantOptions;
    }
    if (product.variants && product.variants.length > 0) {
      const keys = Array.from(new Set(product.variants.flatMap(v => Object.keys(v.options || {}))));
      return keys.map(key => ({
        name: key,
        values: Array.from(new Set(product.variants!.map(v => v.options?.[key]).filter(Boolean) as string[])),
      }));
    }
    return [];
  }, [product.variantOptions, product.variants]);

  const handleOptionSelect = (optName: string, optVal: string) => {
    const updated = { ...selectedOptions, [optName]: optVal };
    setSelectedOptions(updated);
    if (product.variants) {
      const matched = product.variants.find(v =>
        Object.entries(updated).every(([k, val]) => v.options?.[k] === val)
      );
      if (matched) {
        setSelectedVariant(matched);
        if (matched.image) {
          setSelectedImage(matched.image);
        }
      }
    }
  };

  const inWishlist = isInWishlist(product.id);
  const { openEnquiry } = useProductEnquiry();
  const currentPrice = selectedVariant ? selectedVariant.price : (product.salePrice || product.price);
  const originalPrice = selectedVariant
    ? (selectedVariant.compareAtPrice || null)
    : (product.compareAtPrice || (product.salePrice ? product.price : null));
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const availability = getProductAvailability(product, selectedVariant);
  const currentStock = availability.stock;
  const isOutOfStock = availability.isOutOfStock;
  const isLowStock = availability.isLowStock;

  const storageOptions = useMemo(() => extractStorageConfigurations(product), [product]);
  const activeRam =
    selectedOptions['RAM'] ||
    selectedOptions['Memory'] ||
    undefined;
  const activeStorage =
    selectedOptions['Storage'] ||
    selectedOptions['Capacity'] ||
    selectedOptions['SSD'] ||
    storageOptions[0] ||
    undefined;

  const { whatsappNumber: dbWhatsApp, inquiryEmail: dbEmail, storeName } = useStoreSettings();
  const contactWhatsApp = (product as any).contactWhatsApp || dbWhatsApp || '';
  const contactEmail = (product as any).contactEmail || dbEmail || '';

  const handleWhatsApp = () => {
    const cleanNumber = (contactWhatsApp || '').replace(/[^0-9]/g, '');
    const storeLabel = storeName || 'Sales Team';
    const msg = encodeURIComponent(
      `Hi ${storeLabel}, I am interested in ${product.name} (SKU: ${currentSku}). I would like to inquire about ${quantity} unit(s). Please share current pricing and availability.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    const targetEmail = contactEmail || 'support@nextechsystems.com';
    const storeLabel = storeName || 'Sales Team';
    const subject = encodeURIComponent(`Product Inquiry: ${product.name} [SKU: ${currentSku}]`);
    const body = encodeURIComponent(
      `Hello ${storeLabel},\n\nI would like to inquire about pricing and stock availability for:\n- Product: ${product.name}\n- SKU: ${currentSku}\n- Quantity: ${quantity} units\n\nPlease send me current pricing and availability.\n\nThank you.`
    );
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleAddToCart = () => {
    const added = addToCart(product, quantity, selectedVariant);
    if (added) {
      setAddedMessage(true);
      setTimeout(() => setAddedMessage(false), 2500);
    }
  };

  const handleBuyNow = () => {
    const added = addToCart(product, quantity, selectedVariant);
    if (added) {
      router.push('/checkout');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-slate-950/60 backdrop-blur-md transition-all">
      {/* Left Images Gallery */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main Display Image */}
        <div className="aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800 relative shadow-inner group">
          {/* Ambient Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 dark:from-tech-cyan/15 via-transparent to-transparent pointer-events-none" />

          {/* Product Image */}
          <img
            src={
              selectedImage && !selectedImage.includes('1591799264318')
                ? selectedImage
                : product.slug.includes('14900k') || product.name.toLowerCase().includes('14900k')
                ? '/images/intel_i9_14900k.jpg'
                : selectedImage || '/images/intel_i9_14900k.jpg'
            }
            alt={product.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500 relative z-10"
          />

          {product.isFeatured && (
            <span className="absolute top-4 left-4 z-20 bg-tech-blue text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-current" />
              <span>Flagship Hardware</span>
            </span>
          )}

          {/* Dynamic spec badge for CPU or verified hardware badge */}
          {product.specifications?.socket ? (
            <span className="absolute bottom-3 right-3 z-20 text-[10px] font-mono font-bold bg-slate-900/80 dark:bg-slate-950/80 text-white px-2.5 py-0.5 rounded-md backdrop-blur-sm border border-slate-700/50">
              {product.specifications.socket}{product.specifications.boostClock ? ` • ${product.specifications.boostClock}` : ''}
            </span>
          ) : product.brandName ? (
            <span className="absolute bottom-3 right-3 z-20 text-[10px] font-mono font-semibold bg-slate-900/80 dark:bg-slate-950/80 text-slate-200 px-2.5 py-0.5 rounded-md backdrop-blur-sm border border-slate-700/50">
              Official {product.brandName}
            </span>
          ) : null}
        </div>

        {/* Thumbnail Selector */}
        {product.images && product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => {
              const displayImg = img.includes('1591799264318') && product.slug.includes('14900k')
                ? '/images/intel_i9_14900k.jpg'
                : img;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(displayImg)}
                  className={`w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 p-2 border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === displayImg
                      ? 'border-tech-blue shadow-md scale-105'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <img src={displayImg} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-contain" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Product Details & Buy Box */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Product Category & SKU Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {product.categoryName && (
                <span className="font-extrabold text-tech-blue dark:text-cyan-400 uppercase tracking-wider text-[11px]">
                  {product.categoryName}
                </span>
              )}
              {product.brandName && product.brandName.toLowerCase() !== 'comnet tech' && (
                <>
                  {product.categoryName && <span className="text-slate-300 dark:text-slate-600">•</span>}
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    {product.brandName}
                  </span>
                </>
              )}
              {(product.categoryName || (product.brandName && product.brandName.toLowerCase() !== 'comnet tech')) && (
                <span className="text-slate-300 dark:text-slate-600">•</span>
              )}
              <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                SKU: {currentSku}
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Variant Option Pickers */}
          {hasVariants && optionDefinitions.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Configuration & Options
              </div>
              {optionDefinitions.map(def => (
                <div key={def.name} className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>{def.name}:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {selectedOptions[def.name] || 'Select'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {def.values.map(val => {
                      const isSelected = selectedOptions[def.name] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleOptionSelect(def.name, val)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-tech-blue text-white border-tech-blue shadow-sm shadow-blue-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            {isOutOfStock ? (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    Price on Enquiry
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Custom Allocation
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <PackageX className="w-3 h-3 text-slate-400" />
                    <span>Warehouse Zero</span>
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                  Direct online checkout is paused for this configuration. Submit your required RAM, storage, and quantity to receive real-time supplier allocation, batch pricing, and arrival schedule via WhatsApp.
                </div>
              </div>
            ) : isLowStock ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight whitespace-nowrap">
                    Contact for Price
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                    Low Stock
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Direct stock is limited. Inquire below to lock in B2B / wholesale pricing and reserve your units.
                </div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    {formatPrice(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-mono whitespace-nowrap">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  {originalPrice && originalPrice > currentPrice && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono whitespace-nowrap shrink-0">
                      -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% SAVE
                    </span>
                  )}
                </div>
                {product.unitPrice && product.unitMeasure && (
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                    ({formatPrice(product.unitPrice)} / {product.unitMeasure})
                  </div>
                )}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {product.chargeTax === false ? 'VAT Exempt' : 'Includes 5% UAE VAT'} • Free GCC Express Delivery over AED 500
                </div>
              </div>
            )}

            <div className="sm:text-right shrink-0">
              {isOutOfStock ? (
                <div className="inline-flex sm:flex-col sm:items-end gap-1 text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Restock Lead Time: 24–48h
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    WhatsApp Procurement Desk
                  </span>
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/60 px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap">Low Stock — {currentStock} Units Left</span>
                </div>
              ) : currentStock > 0 ? (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="whitespace-nowrap">{currentStock} Units In Stock</span>
                </div>
              ) : product.allowBackorder ? (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="whitespace-nowrap">Available on Backorder</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 rounded-xl border border-red-200 whitespace-nowrap shadow-sm">
                  Sold Out — Currently Out of Stock
                </div>
              )}
            </div>
          </div>

          {/* GCC Buy Now Pay Later (Tamara & Tabby) Promotional Badge */}
          {!isLowStock && !isOutOfStock && <BnplPromoBadge price={currentPrice} className="mt-3.5" />}
        </div>

        {/* Quantity and Actions */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          {isOutOfStock ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quantity Pre-selector */}
                <div className="flex items-center justify-between sm:justify-start gap-3 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2.5 font-mono">
                    Qty:
                  </span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary WhatsApp Enquiry Button */}
                <button
                  type="button"
                  onClick={() => openEnquiry(product, { initialRam: activeRam, initialStorage: activeStorage, initialQuantity: quantity })}
                  className="flex-1 py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 bg-[#25D366] hover:bg-[#20bd5a] text-white active:scale-[0.99]"
                  title="Enquire on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20 shrink-0" />
                  <span>Enquire on WhatsApp</span>
                  <span className="text-xs font-mono opacity-90">({quantity} {quantity === 1 ? 'Unit' : 'Units'})</span>
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer shrink-0 ${
                    inWishlist
                      ? 'border-red-500/40 bg-red-500/10 text-red-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  title={inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
                  <span className="hidden sm:inline">{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {/* Sub-notice */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 dark:text-slate-500 px-1">
                <span>Select RAM & storage configuration directly in the enquiry form</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Official UAE Procurement Line
                </span>
              </div>
            </div>
          ) : isLowStock ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-emerald-600/20 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact via WhatsApp ({quantity} Qty)</span>
              </button>

              <button
                type="button"
                onClick={handleEmail}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-transparent border-2 border-blue-600 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 active:scale-[0.98]"
              >
                <Mail className="w-4 h-4" />
                <span>Contact via Email ({quantity} Qty)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                    inWishlist
                      ? 'border-red-500/40 bg-red-500/10 text-red-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-tech-blue dark:hover:border-tech-cyan'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
                  <span className="hidden sm:inline">{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-tech-blue hover:bg-blue-600 text-white shadow-blue-500/20 active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addedMessage ? 'Added to Cart' : 'Add to Cart'}</span>
                </button>

                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Instant Checkout</span>
                </button>
              </div>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tech-blue dark:text-tech-cyan shrink-0" />
              <span className="font-medium">{product.warranty || '3 Years Official Manufacturer Warranty'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-tech-blue dark:text-tech-cyan shrink-0" />
              <span className="font-medium">
                {isOutOfStock ? 'Dedicated UAE Procurement Allocation' : 'Same-Day UAE Courier Dispatch'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
