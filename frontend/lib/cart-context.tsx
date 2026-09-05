'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Cart } from '@/types';
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
  addToCart: (product: Product, quantity?: number) => void;
  addBundleToCart: (products: Product[]) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [cartData, setCartData] = useState<Cart>(defaultCart);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const { token } = useAuth();

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
    localStorage.setItem('tech_cart_items', JSON.stringify(items));

    if (items.length === 0) {
      setCartData(defaultCart);
      return;
    }

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

  const addToCart = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId: product.id, quantity }];
    });
  };

  const addBundleToCart = (products: Product[]) => {
    setItems(prev => {
      const copy = [...prev];
      for (const p of products) {
        if (!p) continue;
        const existingIdx = copy.findIndex(i => i.productId === p.id);
        if (existingIdx >= 0) {
          copy[existingIdx].quantity += 1;
        } else {
          copy.push({ productId: p.id, quantity: 1 });
        }
      }
      return copy;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCartData(defaultCart);
    localStorage.removeItem('tech_cart_items');
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

  return (
    <CartContext.Provider
      value={{
        cart: cartData,
        cartItems: cartData.items || [],
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
