'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, ProductVariant, CartItem, Cart } from '@/types';
import { ApiClient } from './api-client';
import { useAuth } from './auth-context';

interface CartContextType {
  cart: Cart;
  cartItems: CartItem[];
  cartCount: number;
  wishlist: Product[];
  wishlistCount: number;
  couponCode: string;
  appliedDiscount: number;
  isCalculating: boolean;
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant | null) => void;
  addBundleToCart: (products: Product[]) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCartFromWishlist: (product: Product) => void;
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  taxRate: 5,
  shippingFee: 0,
  walletAmountUsed: 0,
  total: 0,
  currency: 'AED',
};

interface LocalCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  productName?: string;
  sku?: string;
  slug?: string;
  image?: string;
  price?: number;
  salePrice?: number;
  unitPrice?: number;
  sellerType?: string;
  resellerCode?: string;
  variantTitle?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [cartData, setCartData] = useState<Cart>(defaultCart);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const { token, user } = useAuth();
  const prevUserRef = useRef(user);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode('');
    setCartData(defaultCart);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tech_cart_items');
      localStorage.removeItem('tech_coupon_code');
    }
  }, []);

  // Listen for auth_logout event across the application
  useEffect(() => {
    const handleLogout = () => {
      clearCart();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth_logout', handleLogout);
      return () => {
        window.removeEventListener('auth_logout', handleLogout);
      };
    }
  }, [clearCart]);

  // When user transitions from authenticated to logged out, clear cart
  useEffect(() => {
    if (prevUserRef.current && !user) {
      clearCart();
    }
    prevUserRef.current = user;
  }, [user, clearCart]);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('tech_cart_items');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {}
    }
    const savedWish = localStorage.getItem('tech_wishlist');
    if (savedWish) {
      try {
        setWishlist(JSON.parse(savedWish));
      } catch (e) {}
    }
  }, []);

  // Recalculate with backend pricing service whenever items or coupon change
  useEffect(() => {
    if (items.length === 0) {
      setCartData(defaultCart);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tech_cart_items');
      }
      return;
    }

    localStorage.setItem('tech_cart_items', JSON.stringify(items));

    setIsCalculating(true);
    ApiClient.post<Cart>('/cart/calculate', {
      items,
      couponCode: couponCode || undefined,
    }, { token: token || undefined })
      .then(res => setCartData(res))
      .catch(err => {
        console.error('Failed to calculate cart:', err);
      })
      .finally(() => setIsCalculating(false));
  }, [items, couponCode, token]);

  // Wishlist persistence
  useEffect(() => {
    localStorage.setItem('tech_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant | null) => {
    setItems(prev => {
      const vId = selectedVariant?.id;
      const existingIdx = prev.findIndex(
        i => i.productId === product.id && (i.variantId || undefined) === (vId || undefined)
      );
      const effectivePrice = selectedVariant?.price ?? product.price ?? 0;
      const effectiveSalePrice = (selectedVariant as any)?.salePrice ?? selectedVariant?.price ?? product.salePrice ?? effectivePrice;
      const unitPrice = effectiveSalePrice > 0 ? effectiveSalePrice : effectivePrice;
      const itemData: LocalCartItem = {
        productId: product.id,
        variantId: vId || undefined,
        quantity: existingIdx >= 0 ? prev[existingIdx].quantity + quantity : quantity,
        productName: product.name || product.title || '',
        sku: selectedVariant?.sku || product.sku || '',
        slug: product.slug || '',
        image: selectedVariant?.image || product.thumbnail || product.images?.[0] || '',
        price: effectivePrice,
        salePrice: effectiveSalePrice,
        unitPrice,
        sellerType: product.sellerType || 'ADMIN',
        resellerCode: product.resellerCode,
        variantTitle: selectedVariant?.title,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          ...itemData,
        };
        return copy;
      }
      return [...prev, itemData];
    });
  };

  const addBundleToCart = (products: Product[]) => {
    setItems(prev => {
      const copy = [...prev];
      for (const p of products) {
        if (!p) continue;
        const existingIdx = copy.findIndex(i => i.productId === p.id && !i.variantId);
        const effectivePrice = p.price ?? 0;
        const effectiveSalePrice = p.salePrice ?? effectivePrice;
        const unitPrice = effectiveSalePrice > 0 ? effectiveSalePrice : effectivePrice;
        const itemData: LocalCartItem = {
          productId: p.id,
          quantity: existingIdx >= 0 ? copy[existingIdx].quantity + 1 : 1,
          productName: p.name || p.title || '',
          sku: p.sku || '',
          slug: p.slug || '',
          image: p.thumbnail || p.images?.[0] || '',
          price: effectivePrice,
          salePrice: effectiveSalePrice,
          unitPrice,
          sellerType: p.sellerType || 'ADMIN',
          resellerCode: p.resellerCode,
        };

        if (existingIdx >= 0) {
          copy[existingIdx] = { ...copy[existingIdx], ...itemData };
        } else {
          copy.push(itemData);
        }
      }
      return copy;
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setItems(prev =>
      prev.filter(
        i => !(i.productId === productId && (i.variantId || undefined) === (variantId || undefined))
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.productId === productId && (i.variantId || undefined) === (variantId || undefined)
          ? { ...i, quantity }
          : i
      )
    );
  };


  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await ApiClient.post('/cart/coupon/validate', {
        code,
        subtotal: cartData.subtotal,
      });
      if (res && res.code) {
        setCouponCode(res.code);
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err.message || 'Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const moveToCartFromWishlist = (product: Product) => {
    addToCart(product, 1);
    setWishlist(prev => prev.filter(p => p.id !== product.id));
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const cartItems: CartItem[] =
    cartData.items && cartData.items.length > 0
      ? cartData.items.map(it => {
          const local = items.find(
            i => i.productId === it.productId && (i.variantId || undefined) === (it.variantId || undefined)
          );
          const price = it.price && it.price > 0 ? it.price : (local?.price || 0);
          const salePrice = it.salePrice && it.salePrice > 0 ? it.salePrice : (local?.salePrice || price);
          const unitPrice = it.unitPrice && it.unitPrice > 0 ? it.unitPrice : (salePrice > 0 ? salePrice : price);
          const subtotal = it.subtotal && it.subtotal > 0 ? it.subtotal : unitPrice * (it.quantity || 1);

          return {
            ...it,
            productName: it.productName || local?.productName || 'Hardware Product',
            sku: it.sku || local?.sku || '',
            slug: it.slug || local?.slug || it.productId,
            image: it.image || local?.image || '',
            price,
            salePrice,
            unitPrice,
            subtotal,
            variantTitle: it.variantTitle || local?.variantTitle,
          };
        })
      : items.map(local => {
          const price = local.price || 0;
          const salePrice = local.salePrice || price;
          const unitPrice = local.unitPrice || (salePrice > 0 ? salePrice : price);
          return {
            productId: local.productId,
            variantId: local.variantId,
            variantTitle: local.variantTitle,
            quantity: local.quantity,
            productName: local.productName || 'Hardware Product',
            sku: local.sku || '',
            slug: local.slug || local.productId,
            image: local.image || '',
            price,
            salePrice,
            unitPrice,
            subtotal: unitPrice * local.quantity,
            sellerType: (local.sellerType as any) || 'ADMIN',
            resellerCode: local.resellerCode,
            stockAvailable: 50,
          };
        });

  return (
    <CartContext.Provider
      value={{
        cart: cartData,
        cartItems,
        cartCount,
        wishlist,
        wishlistCount: wishlist.length,
        couponCode,
        appliedDiscount: cartData.discount,
        isCalculating,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        isInWishlist,
        moveToCartFromWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
