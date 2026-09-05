'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
            theme === 'light'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
            theme === 'dark'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5 text-tech-cyan" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
          title="System Sync"
        >
          <Monitor className="w-3.5 h-3.5 text-purple-400" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  // Icon Button (Ant Design / Shadcn standard icon toggle)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
        resolvedTheme === 'dark'
          ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700/80 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm'
      } ${className}`}
      title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-tech-blue transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
