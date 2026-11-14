'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Flame,
  Truck,
  Zap,
  Sparkles,
  Clock,
  Bell,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { StoreSettings } from '@/types';
import { useStoreSettings } from '@/lib/use-store-settings';

export interface HeaderNotification {
  id: string;
  prefix?: string;
  text: string;
  link?: string;
  icon?: 'flame' | 'truck' | 'zap' | 'sparkles' | 'clock' | 'bell' | 'info';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  displayDurationSeconds?: number;
  showCountdown?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementBarSettings extends Partial<StoreSettings> {
  headerNotifications?: HeaderNotification[];
  notificationRotationSeconds?: number;
  isAnnouncementActive?: boolean;
  announcementText?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  truck: Truck,
  zap: Zap,
  sparkles: Sparkles,
  clock: Clock,
  bell: Bell,
  info: Info,
};

interface TopAnnouncementBarProps {
  customSettings?: AnnouncementBarSettings;
  previewMode?: boolean;
}

export function TopAnnouncementBar({ customSettings, previewMode = false }: TopAnnouncementBarProps) {
  const { settings: globalSettings } = useStoreSettings();
  const settings = (customSettings || globalSettings) as AnnouncementBarSettings | null;
  const shouldReduceMotion = useReducedMotion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Update clock every second for live timers/countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter active and unexpired notifications
  const activeNotifications = useMemo(() => {
    if (!settings) return [];
    if (settings.isAnnouncementActive === false && !previewMode) {
      return [];
    }

    const list: HeaderNotification[] = settings.headerNotifications || [];

    if (list.length === 0) {
      // Default fallback
      if (settings.isAnnouncementActive !== false || previewMode) {
        const fallback: HeaderNotification = {
          id: 'fallback_gcc',
          prefix: 'GCC EXPRESS DISPATCH:',
          text: settings.announcementText || 'Free Insured Shipping on Orders over AED 500 across UAE & Region',
          icon: 'flame',
          isActive: true,
        };
        return [fallback];
      }
      return [];
    }

    return list.filter((n) => {
      if (previewMode) return true; // In preview mode, allow viewing all notifications
      if (n.isActive === false) return false;
      if (n.startDate && new Date(n.startDate) > now) return false;
      if (n.endDate && new Date(n.endDate) < now) return false;
      return true;
    });
  }, [settings, previewMode, now]);

  // Keep currentIndex bounded
  useEffect(() => {
    if (activeNotifications.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= activeNotifications.length) {
      setCurrentIndex(0);
    }
  }, [activeNotifications.length, currentIndex]);

  // Auto-rotation timer
  const rotationSeconds = settings?.notificationRotationSeconds || 5;
  useEffect(() => {
    if (activeNotifications.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
    }, rotationSeconds * 1000);

    return () => clearInterval(interval);
  }, [activeNotifications.length, isPaused, rotationSeconds]);

  if (activeNotifications.length === 0) {
    return null;
  }

  const currentNotif = activeNotifications[currentIndex] || activeNotifications[0];
  const IconComponent = (currentNotif.icon && ICON_MAP[currentNotif.icon]) || Flame;

  // Format countdown string if notification has endDate
  const getRemainingTime = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const diff = new Date(endDateStr).getTime() - now.getTime();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 48) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const remainingTime = currentNotif.showCountdown && currentNotif.endDate
    ? getRemainingTime(currentNotif.endDate)
    : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeNotifications.length) % activeNotifications.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative bg-slate-900 dark:bg-slate-950 text-slate-300 text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-slate-800/80 transition-colors select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left spacer for centered alignment */}
        <div className="w-12 hidden sm:block shrink-0" />

        {/* Center: Animated Notification Slide */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotif.id || currentIndex}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 7 }}
              transition={{ duration: shouldReduceMotion ? 0.05 : 0.22, ease: 'easeOut' }}
              className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-medium tracking-wide text-center"
            >
              {/* Optional Click-through wrapper */}
              {currentNotif.link ? (
                <Link
                  href={currentNotif.link}
                  className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 hover:text-white group transition-colors"
                >
                  {/* Icon & Prefix */}
                  {currentNotif.prefix && (
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-400 group-hover:text-amber-300 shrink-0">
                      <IconComponent className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      <span>{currentNotif.prefix}</span>
                    </div>
                  )}

                  {/* Notification text */}
                  <span className="text-slate-200 group-hover:text-white font-medium">
                    {currentNotif.text}
                  </span>

                  {/* Countdown Badge */}
                  {remainingTime && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{remainingTime}</span>
                    </span>
                  )}

                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0 ml-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>
              ) : (
                <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {/* Icon & Prefix */}
                  {currentNotif.prefix && (
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-400 shrink-0">
                      <IconComponent className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      <span>{currentNotif.prefix}</span>
                    </div>
                  )}

                  {/* Notification text */}
                  <span className="text-slate-200 font-medium">
                    {currentNotif.text}
                  </span>

                  {/* Countdown Badge */}
                  {remainingTime && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{remainingTime}</span>
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Rotation controls if multiple notifications */}
        <div className="flex items-center gap-1 shrink-0">
          {activeNotifications.length > 1 && (
            <div className="flex items-center gap-1">
              {/* Prev button */}
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Previous announcement"
                title="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Dots / Count indicator */}
              <div className="hidden xs:flex items-center gap-1 px-1">
                {activeNotifications.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx
                        ? 'w-4 bg-amber-400'
                        : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next button */}
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Next announcement"
                title="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
