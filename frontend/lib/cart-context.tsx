'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant | null) => boolean;
  addBundleToCart: (products: Product[]) => boolean;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCartFromWishlist: (product: Product) => boolean;
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
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [cartData, setCartData] = useState<Cart>(defaultCart);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  const prevUserIdRef = useRef<string | null>(null);

  // Clear cart in memory and user storage
  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode('');
    setCartData(defaultCart);
    if (typeof window !== 'undefined') {
      if (user?.id) {
        localStorage.removeItem(`tech_cart_items_${user.id}`);
        localStorage.removeItem(`tech_coupon_code_${user.id}`);
      }
      localStorage.removeItem('tech_cart_items');
      localStorage.removeItem('tech_coupon_code');
    }
  }, [user?.id]);

  // Clean up any legacy unauthenticated cart data from previous sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tech_cart_items');
    }
  }, []);

  // Synchronize cart state on user authentication transitions (Login / Logout / User Switch)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User is logged out / guest: cart must be completely empty!
      setItems([]);
      setCouponCode('');
      setCartData(defaultCart);
      setWishlist([]);
      prevUserIdRef.current = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tech_cart_items');
      }
      return;
    }

    // User is logged in
    const currentUserId = user.id;
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;

      // Load user-scoped cart
      const userCartKey = `tech_cart_items_${currentUserId}`;
      const savedUserCart = localStorage.getItem(userCartKey);
      if (savedUserCart) {
        try {
          const parsed = JSON.parse(savedUserCart);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          } else {
            setItems([]);
          }
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }

      // Load user-scoped coupon
      const savedCoupon = localStorage.getItem(`tech_coupon_code_${currentUserId}`);
      if (savedCoupon) {
        setCouponCode(savedCoupon);
      } else {
        setCouponCode('');
      }

      // Load user-scoped wishlist
      const savedWishlist = localStorage.getItem(`tech_wishlist_${currentUserId}`);
      if (savedWishlist) {
        try {
          const parsedWish = JSON.parse(savedWishlist);
          if (Array.isArray(parsedWish)) {
            setWishlist(parsedWish);
          }
        } catch {}
      }
    }
  }, [user, authLoading]);

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

  // Recalculate with backend pricing service whenever items or coupon change
  useEffect(() => {
    if (!user || items.length === 0) {
      setCartData(defaultCart);
      if (user?.id && typeof window !== 'undefined') {
        localStorage.removeItem(`tech_cart_items_${user.id}`);
      }
      return;
    }

    // Persist to user-scoped storage
    if (user?.id && typeof window !== 'undefined') {
      localStorage.setItem(`tech_cart_items_${user.id}`, JSON.stringify(items));
      if (couponCode) {
        localStorage.setItem(`tech_coupon_code_${user.id}`, couponCode);
      } else {
        localStorage.removeItem(`tech_coupon_code_${user.id}`);
      }
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
  }, [items, couponCode, token, user]);

  // Wishlist persistence for logged in user
  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      localStorage.setItem(`tech_wishlist_${user.id}`, JSON.stringify(wishlist));
    }
  }, [wishlist, user?.id]);

  // Directly redirect unauthenticated users to login with return path
  const promptLogin = useCallback(() => {
    const returnUrl = typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : (pathname || '/');
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }, [router, pathname]);

  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant | null): boolean => {
    if (!user) {
      promptLogin();
      return false;
    }

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

    return true;
  };

  const addBundleToCart = (products: Product[]): boolean => {
    if (!user) {
      promptLogin();
      return false;
    }

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

    return true;
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    if (!user) return;
    setItems(prev =>
      prev.filter(
        i => !(i.productId === productId && (i.variantId || undefined) === (variantId || undefined))
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (!user) return;
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
    if (!user) {
      promptLogin();
      return false;
    }
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
    if (!user) {
      promptLogin();
      return;
    }
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    if (!user) return false;
    return wishlist.some(p => p.id === productId);
  };

  const moveToCartFromWishlist = (product: Product): boolean => {
    if (!user) {
      promptLogin();
      return false;
    }
    const added = addToCart(product, 1);
    if (added) {
      setWishlist(prev => prev.filter(p => p.id !== product.id));
    }
    return added;
  };

  const cartCount = user ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const cartItems: CartItem[] = !user
    ? []
    : cartData.items && cartData.items.length > 0
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

  const activeCart = user ? cartData : defaultCart;

  return (
    <CartContext.Provider
      value={{
        cart: activeCart,
        cartItems,
        cartCount,
        wishlist: user ? wishlist : [],
        wishlistCount: user ? wishlist.length : 0,
        couponCode: user ? couponCode : '',
        appliedDiscount: user ? activeCart.discount : 0,
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
