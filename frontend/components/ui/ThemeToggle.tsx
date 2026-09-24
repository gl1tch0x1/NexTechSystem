'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Professional Theme Toggle Icon Button
 * Matches the exact design and layout from the specification image:
 * - Sits seamlessly alongside the Wishlist (Heart) button with matching dimensions and radius
 * - In Light Mode: Shows the sleek Moon (☾) icon in tech-blue
 * - In Dark Mode: Shows the sleek Sun (☀️) icon in radiant amber
 * - Smooth micro-animations on hover and click
 * - Immediate zero-latency DOM updates with SSR/hydration safety
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (theme === 'system' ? resolvedTheme === 'dark' : theme === 'dark') : false;

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        if (document.body) {
          document.body.classList.add('dark');
          document.body.classList.remove('light');
        }
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        if (document.body) {
          document.body.classList.remove('dark');
          document.body.classList.add('light');
        }
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={mounted ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Theme'}
      className={`group relative p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue/50 ${className}`}
    >
      {/* Light Mode: Displays Moon (☾) icon in tech-blue */}
      <Moon className="w-4 h-4 text-tech-blue dark:hidden transition-transform duration-300 group-hover:-rotate-12" />

      {/* Dark Mode: Displays Sun (☀️) icon in amber */}
      <Sun className="w-4 h-4 text-amber-400 hidden dark:block transition-transform duration-300 group-hover:rotate-45" />

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
