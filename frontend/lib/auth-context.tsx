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
      return;
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string, resellerCode?: string): Promise<{ user: User; reseller: Reseller | null }> => {
    const cleanEmail = email ? email.trim() : '';
    setIsLoading(true);
    try {
      const res = await ApiClient.post<{ token: string; user: User }>('/auth/login', {
        email: cleanEmail,
        password,
        resellerCode,
      });

      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);

      if (isLiveKey && firebaseAuth && firebaseAuth.app && password) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        } catch (fbErr: any) {
          if (fbErr?.code !== 'auth/user-not-found' && fbErr?.code !== 'auth/invalid-credential') {
            console.warn('Firebase email auth unavailable; backend session remains authoritative.', fbErr);
          }
        }
      }

      const profile = await fetchCurrentUser(res.token);
      return profile || { user: res.user, reseller: null };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, username?: string, phone?: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
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

      if (isLiveKey && firebaseAuth && firebaseAuth.app && password) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        } catch (fbErr: any) {
          if (fbErr?.code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(firebaseAuth, email.trim(), password).catch(() => undefined);
          } else {
            console.warn('Firebase registration sync failed; backend account remains active.', fbErr);
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
      if (!isLiveKey || !firebaseAuth || !firebaseAuth.app) {
        throw new Error('Google authentication is unavailable because Firebase Auth is not configured.');
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const fbResult = await signInWithPopup(firebaseAuth, provider);
      const fbUser = fbResult.user;
      const idToken = await fbUser.getIdToken();

      const res = await ApiClient.post<{ token: string; user: User }>('/auth/google', {
        idToken,
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
      firebaseSignOut(firebaseAuth).catch(() => undefined);
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
        role: user?.role ?? null,
        token,
        isAuthenticated: Boolean(user && token),
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
