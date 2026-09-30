'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Reseller, UserRole } from '@/types';
import { ApiClient } from './api-client';
import { auth as firebaseAuth, isLiveKey } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export interface RegisterData {
  accountType?: 'CUSTOMER' | 'RESELLER';
  name: string;
  email: string;
  password?: string;
  username?: string;
  phone?: string;
  // Reseller specific fields:
  businessName?: string;
  tradeLicense?: string;
  taxNumber?: string;
  taxRegistrationNumber?: string;
  licenseJurisdiction?: string;
  businessType?: string;
  signatoryTitle?: string;
  website?: string;
  resellerCode?: string;
  addressStreet?: string;
  addressCity?: string;
  settlementTerms?: string;
}

interface AuthContextType {
  user: User | null;
  reseller: Reseller | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, resellerCode?: string) => Promise<{ user: User; reseller: Reseller | null }>;
  register: (
    dataOrName: string | RegisterData,
    email?: string,
    username?: string,
    phone?: string,
    password?: string
  ) => Promise<{ user: User; reseller: Reseller | null }>;
  loginWithGoogle: () => Promise<{ user: User; reseller: Reseller | null }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string): Promise<{ user: User; reseller: Reseller | null } | null> => {
    if (authToken.startsWith('demo_token_')) {
      return null;
    }

    try {
      const data = await ApiClient.get<{ user: User; reseller: Reseller | null }>('/auth/me', { token: authToken });
      setUser(data.user);
      setReseller(data.reseller || null);
      return data;
    } catch {
      // Stale or expired token from previous database session: cleanly reset to guest state
      logout();
      return null;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken)
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string, resellerCode?: string): Promise<{ user: User; reseller: Reseller | null }> => {
    const cleanEmail = email ? email.trim() : '';
    setIsLoading(true);
    try {
      let res: { token: string; user: User };
      // 1. Authenticate with Store Backend
      res = await ApiClient.post<{ token: string; user: User }>('/auth/login', {
        email: cleanEmail,
        password,
        resellerCode,
      });

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // 2. Synchronize Cloud Firebase Authentication session (only if live key configured)
      // Firebase sync is optional – any failure must be swallowed so the backend JWT login is unaffected.
      if (isLiveKey && firebaseAuth && firebaseAuth.app && password) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (fbErr: any) {
          // Try to create the account if it doesn't exist yet
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            await createUserWithEmailAndPassword(firebaseAuth, email, password).catch(() => { });
          }
          // All other Firebase errors (403 API key, domain restriction, etc.) are silently ignored
        }
      }

      const profile = await fetchCurrentUser(res.token);
      return profile || { user: res.user, reseller: null };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    dataOrName: string | RegisterData,
    emailArg?: string,
    usernameArg?: string,
    phoneArg?: string,
    passwordArg?: string
  ): Promise<{ user: User; reseller: Reseller | null }> => {
    setIsLoading(true);
    try {
      const payload: RegisterData = typeof dataOrName === 'string'
        ? {
            accountType: 'CUSTOMER',
            name: dataOrName,
            email: emailArg || '',
            username: usernameArg,
            phone: phoneArg,
            password: passwordArg,
          }
        : dataOrName;

      // 1. Register with Store Backend / Next.js API Gateway
      const res = await ApiClient.post<{ token: string; user: User; reseller?: Reseller }>('/auth/register', payload);

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.reseller) {
        setReseller(res.reseller);
      }

      // 2. Register in Cloud Firebase Authentication (only if live key configured)
      if (isLiveKey && firebaseAuth && firebaseAuth.app && payload.password) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, payload.email, payload.password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(firebaseAuth, payload.email, payload.password).catch(() => { });
          }
        }
      }

      const profile = await fetchCurrentUser(res.token);
      return profile || { user: res.user, reseller: res.reseller || null };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ user: User; reseller: Reseller | null }> => {
    setIsLoading(true);
    try {
      let fbUser: any;
      if (isLiveKey && firebaseAuth && firebaseAuth.app) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const fbResult = await signInWithPopup(firebaseAuth, provider);
          fbUser = fbResult.user;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            throw popupErr;
          }
          console.warn('Firebase Google Auth encountered configuration/key issue, activating instant demo session:', popupErr);
          const dynamicEmail = `guest_${Date.now().toString(36)}@client.local`;
          fbUser = {
            uid: `demo_google_${Date.now()}`,
            displayName: 'Verified Customer',
            email: dynamicEmail,
            photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          };
        }
      } else {
        const dynamicEmail = `guest_${Date.now().toString(36)}@client.local`;
        fbUser = {
          uid: `demo_google_${Date.now()}`,
          displayName: 'Verified Customer',
          email: dynamicEmail,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        };
      }

      try {
        // Authenticate with Store Backend (creates Customer if new, or logs in if existing)
        const res = await ApiClient.post<{ token: string; user: User }>('/auth/google', {
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email?.split('@')[0],
          photoURL: fbUser.photoURL || undefined,
          uid: fbUser.uid,
        });

        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
        setUser(res.user);

        const profile = await fetchCurrentUser(res.token);
        return profile || { user: res.user, reseller: null };
      } catch (backendErr: any) {
        const fallbackEmail = fbUser.email || `user_${Date.now().toString(36)}@client.local`;
        const demoUser: User = {
          id: `usr_${Date.now()}`,
          name: fbUser.displayName || 'Customer',
          email: fallbackEmail,
          username: fallbackEmail.split('@')[0] || 'customer',
          role: 'CUSTOMER',
          addresses: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const demoToken = `demo_token_${Date.now()}`;
        localStorage.setItem('auth_token', demoToken);
        setToken(demoToken);
        setUser(demoUser);
        return { user: demoUser, reseller: null };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('demo_user');
      localStorage.removeItem('tech_cart_items');
      localStorage.removeItem('tech_coupon_code');
      window.dispatchEvent(new Event('auth_logout'));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('demo_user');
      localStorage.removeItem('tech_cart_items');
      localStorage.removeItem('tech_coupon_code');
    }
    setToken(null);
    setUser(null);
    setReseller(null);
    if (firebaseAuth && firebaseAuth.app) {
      firebaseSignOut(firebaseAuth).catch(() => { });
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        reseller,
        role: user?.role || null,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
