'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    setResolvedTheme('light');
    root.classList.remove('dark');
    root.classList.add('light');
    if (document.body) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nextech-theme-changed', { detail: { theme: 'light', resolvedTheme: 'light' } }));
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('nextech_theme', 'light');
    } catch {}
    applyTheme();
  }, []);

  const setTheme = (_newTheme: Theme) => {
    setThemeState('light');
    applyTheme();
  };

  const toggleTheme = () => {
    applyTheme();
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
