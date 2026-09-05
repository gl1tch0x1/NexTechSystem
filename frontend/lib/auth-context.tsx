'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Reseller, UserRole } from '@/types';
import { ApiClient } from './api-client';
import { auth as firebaseAuth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  reseller: Reseller | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, resellerCode?: string) => Promise<{ user: User; reseller: Reseller | null }>;
  register: (name: string, email: string, username?: string, phone?: string, password?: string) => Promise<User>;
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

  const login = async (email: string, password = 'password123', resellerCode?: string): Promise<{ user: User; reseller: Reseller | null }> => {
    setIsLoading(true);
    try {
      // 1. Authenticate with Store Backend
      const res = await ApiClient.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
        resellerCode,
      });

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // 2. Synchronize Cloud Firebase Authentication session (if configured)
      if (firebaseAuth && firebaseAuth.app) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            await createUserWithEmailAndPassword(firebaseAuth, email, password).catch(() => {});
          }
        }
      }

      const profile = await fetchCurrentUser(res.token);
      return profile || { user: res.user, reseller: null };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, username?: string, phone?: string, password = 'password123'): Promise<User> => {
    setIsLoading(true);
    try {
      // 1. Register with Store Backend (Creates customer account & wallet)
      const res = await ApiClient.post<{ token: string; user: User }>('/auth/register', {
        name,
        email,
        username,
        phone,
        password,
      });

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // 2. Register in Cloud Firebase Authentication (if configured)
      if (firebaseAuth && firebaseAuth.app) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(firebaseAuth, email, password).catch(() => {});
          }
        }
      }

      await fetchCurrentUser(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ user: User; reseller: Reseller | null }> => {
    setIsLoading(true);
    try {
      if (!firebaseAuth || !firebaseAuth.app) {
        throw new Error('Google Sign-In requires active Firebase configuration.');
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const fbResult = await signInWithPopup(firebaseAuth, provider);
      const fbUser = fbResult.user;

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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setReseller(null);
    if (firebaseAuth && firebaseAuth.app) {
      firebaseSignOut(firebaseAuth).catch(() => {});
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
