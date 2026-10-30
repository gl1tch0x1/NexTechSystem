'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  login: (email: string, password?: string, resellerCode?: string, mfaCode?: string) => Promise<{ user: User; reseller: Reseller | null }>;
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
  const sessionRevision = useRef(0);
  const pendingLogout = useRef<Promise<unknown>>(Promise.resolve());
  const pendingAuthentication = useRef<Promise<unknown>>(Promise.resolve());

  const fetchCurrentUser = async (authToken: string, revision = sessionRevision.current): Promise<{ user: User; reseller: Reseller | null } | null> => {
    if (revision !== sessionRevision.current) return null;
    if (authToken.startsWith('demo_token_')) {
      return null;
    }

    try {
      const data = await ApiClient.get<{ user: User; reseller: Reseller | null }>('/auth/me', { token: authToken });
      if (revision !== sessionRevision.current) return null;
      setUser(data.user);
      setReseller(data.reseller || null);
      return data;
    } catch {
      // Stale or expired token from previous database session: cleanly reset to guest state
      if (revision === sessionRevision.current) logout();
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

  const login = async (email: string, password?: string, resellerCode?: string, mfaCode?: string): Promise<{ user: User; reseller: Reseller | null }> => {
    const cleanEmail = email ? email.trim() : '';
    setIsLoading(true);
    const revision = ++sessionRevision.current;
    try {
      await pendingLogout.current;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');
      // Only a completed backend login may establish a session.
      const authentication = ApiClient.post<{ token: string; user: User; requiresMfa?: boolean; mfaTicket?: string }>('/auth/login', {
        email: cleanEmail,
        password,
        resellerCode,
        mfaCode,
      });

      pendingAuthentication.current = authentication;
      const res = await authentication;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');

      if (res.requiresMfa) {
        throw Object.assign(new Error('Multi-factor authentication is required to complete sign-in.'), {
          code: 'MFA_REQUIRED', details: { requiresMfa: true, mfaTicket: res.mfaTicket },
        });
      }
      if (!res.token || !res.user) {
        throw new Error('Authentication service returned an incomplete session.');
      }

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // Password sessions belong solely to the backend; Firebase is used for Google Sign-In.
      const profile = await fetchCurrentUser(res.token, revision);
      if (!profile) throw new Error('Unable to verify your session. Please sign in again.');
      return profile;
    } finally {
      if (revision === sessionRevision.current) setIsLoading(false);
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
    const revision = ++sessionRevision.current;
    try {
      await pendingLogout.current;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');
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
      const authentication = ApiClient.post<{ token: string; user: User; reseller?: Reseller }>('/auth/register', payload);
      pendingAuthentication.current = authentication;
      const res = await authentication;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');

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

      const profile = await fetchCurrentUser(res.token, revision);
      if (!profile) throw new Error('Unable to verify your session. Please sign in again.');
      return profile;
    } finally {
      if (revision === sessionRevision.current) setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ user: User; reseller: Reseller | null }> => {
    setIsLoading(true);
    const revision = ++sessionRevision.current;
    try {
      await pendingLogout.current;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');
      if (!isLiveKey || !firebaseAuth || !firebaseAuth.app) {
        throw new Error('Google Sign-In is currently unavailable. Please use your email and password.');
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const fbResult = await signInWithPopup(firebaseAuth, provider);
      const idToken = await fbResult.user.getIdToken();
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');
      const authentication = ApiClient.post<{ token: string; user: User }>('/auth/google', { idToken });
      pendingAuthentication.current = authentication;
      const res = await authentication;
      if (revision !== sessionRevision.current) throw new Error('Sign-in was cancelled.');
      if (!res.token || !res.user) {
        throw new Error('Authentication service returned an incomplete session.');
      }
      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const profile = await fetchCurrentUser(res.token, revision);
      if (!profile) throw new Error('Unable to verify your session. Please sign in again.');
      return profile;
    } finally {
      if (revision === sessionRevision.current) setIsLoading(false);
    }
  };

  const logout = () => {
    ++sessionRevision.current;
    pendingLogout.current = Promise.allSettled([pendingLogout.current, pendingAuthentication.current])
      .then(() => ApiClient.post('/auth/logout'))
      .catch(() => {});
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
    setIsLoading(false);
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
