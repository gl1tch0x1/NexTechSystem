'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/types';
import { ProductEnquiryModal } from '@/components/product/ProductEnquiryModal';

export interface ProductEnquiryOptions {
  initialRam?: string;
  initialStorage?: string;
  initialQuantity?: number;
}

export interface ProductEnquiryContextType {
  openEnquiry: (product: Product, options?: ProductEnquiryOptions) => void;
  closeEnquiry: () => void;
}

const ProductEnquiryContext = createContext<ProductEnquiryContextType | undefined>(undefined);

export function ProductEnquiryProvider({ children }: { children: React.ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [initialRam, setInitialRam] = useState<string | undefined>(undefined);
  const [initialStorage, setInitialStorage] = useState<string | undefined>(undefined);
  const [initialQuantity, setInitialQuantity] = useState<number>(1);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openEnquiry = useCallback((product: Product, options?: ProductEnquiryOptions) => {
    setActiveProduct(product);
    setInitialRam(options?.initialRam);
    setInitialStorage(options?.initialStorage);
    setInitialQuantity(options?.initialQuantity || 1);
    setIsOpen(true);
  }, []);

  const closeEnquiry = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ProductEnquiryContext.Provider value={{ openEnquiry, closeEnquiry }}>
      {children}
      {activeProduct && (
        <ProductEnquiryModal
          isOpen={isOpen}
          product={activeProduct}
          initialRam={initialRam}
          initialStorage={initialStorage}
          initialQuantity={initialQuantity}
          onClose={closeEnquiry}
        />
      )}
    </ProductEnquiryContext.Provider>
  );
}

export function useProductEnquiry(): ProductEnquiryContextType {
  const ctx = useContext(ProductEnquiryContext);
  if (!ctx) {
    throw new Error('useProductEnquiry must be used within a ProductEnquiryProvider');
  }
  return ctx;
}
