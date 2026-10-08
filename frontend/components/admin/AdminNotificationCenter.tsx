'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { AdminNotification, AdminNotificationsResponse } from '@/types';
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertCircle,
  Package,
  Store,
  FileText,
  Truck,
  ArrowRight,
  Boxes,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';

interface NotificationCenterProps {
  className?: string;
}

export function AdminNotificationCenter({ className = '' }: NotificationCenterProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminNotificationsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIONS' | 'ORDERS' | 'INVENTORY' | 'PARTNERS'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [lastSyncText, setLastSyncText] = useState('Just now');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number | null>(null);

  // Initialize sound preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nextech_admin_notif_sound');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextech_admin_notif_sound', String(nextVal));
    }
  };

  // Subtle web audio chime for new critical/actionable alerts
  const playAlertChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // Audio context might be waiting for user gesture
    }
  }, [soundEnabled]);

  // Main fetch engine
  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const res = await ApiClient.get<{ success: boolean; data: AdminNotificationsResponse }>(
          '/admin/notifications',
          { token: token || undefined }
        );

        if (res?.success && res.data) {
          const newPayload = res.data;
          // Trigger audio if unread items increased
          if (
            prevUnreadCountRef.current !== null &&
            newPayload.unreadCount > prevUnreadCountRef.current &&
            newPayload.actionRequiredCount > 0
          ) {
            playAlertChime();
          }
          prevUnreadCountRef.current = newPayload.unreadCount;
          setData(newPayload);
          setLastSyncText(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn('[AdminNotificationCenter] Polling error:', err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [token, playAlertChime]
  );

  // Initial fetch and auto-polling every 20 seconds
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 20000);

    const handleFocus = () => {
      fetchNotifications(false);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setData(prev => {
        if (!prev) return prev;
        const updated = prev.notifications.map(n => (n.id === id ? { ...n, isRead: true } : n));
        return {
          ...prev,
          notifications: updated,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          actionRequiredCount: prev.notifications.find(n => n.id === id)?.actionRequired
            ? Math.max(0, prev.actionRequiredCount - 1)
            : prev.actionRequiredCount,
        };
      });

      await ApiClient.put(`/admin/notifications/${id}/read`, {}, { token: token || undefined });
    } catch (err) {
      console.warn('[AdminNotificationCenter] Failed to mark read:', err);
      fetchNotifications(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
          actionRequiredCount: 0,
          criticalCount: 0,
        };
      });

      await ApiClient.put('/admin/notifications/read-all', {}, { token: token || undefined });
    } catch (err) {
      console.warn('[AdminNotificationCenter] Failed to mark all read:', err);
      fetchNotifications(false);
    }
  };

  // Direct action button dispatch
  const handleActionClick = async (notif: AdminNotification) => {
    setActionInProgressId(notif.id);
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    setActionInProgressId(null);
    router.push(notif.actionUrl);
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? 0;
  const actionRequiredCount = data?.actionRequiredCount ?? 0;
  const criticalCount = data?.criticalCount ?? 0;

  // Filter items according to active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'ACTIONS') return n.actionRequired && !n.isRead;
    if (activeTab === 'ORDERS') return n.category === 'ORDERS';
    if (activeTab === 'INVENTORY') return n.category === 'INVENTORY';
    if (activeTab === 'PARTNERS') return n.category === 'RESELLERS' || n.category === 'QUOTES';
    return true; // 'ALL'
  });

  // Relative time helper
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recent';
    }
  };

  // Category Icon Resolver
  const getNotificationIcon = (n: AdminNotification) => {
    switch (n.type) {
      case 'ORDER_PENDING_APPROVAL':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'ORDER_INSTORE_PENDING':
        return <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'ORDER_COD_DISPATCH':
        return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'PRODUCT_OUT_OF_STOCK':
        return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'PRODUCT_LOW_STOCK':
        return <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'PRODUCT_APPROVAL_PENDING':
        return <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'RESELLER_PENDING_APPROVAL':
        return <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'QUOTE_PENDING_REVIEW':
        return <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ========================================================================= */}
      {/* 1. BELL TRIGGER BUTTON */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Admin Notifications & Action Center"
        aria-expanded={isOpen}
        title="Admin Notifications & Action Center"
        className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-xs'
            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-2xs'
        }`}
      >
        {criticalCount > 0 ? (
          <BellRing className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Dynamic Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full text-[10px] font-black font-mono flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm ${
              criticalCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-blue-600'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Action pulse beacon if urgent action is required */}
        {actionRequiredCount > 0 && (
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* ========================================================================= */}
      {/* 2. SLIDE-DOWN NOTIFICATION CENTER PANEL */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[92vw] sm:w-[460px] md:w-[500px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Action & Alert Center</span>
                    {actionRequiredCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                        {actionRequiredCount} Action{actionRequiredCount > 1 ? 's' : ''} Due
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Sync • {lastSyncText}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Audio Toggle */}
                <button
                  type="button"
                  onClick={toggleSound}
                  title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Manual Refresh */}
                <button
                  type="button"
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                  title="Refresh Notifications"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                </button>

                {/* Mark All Read */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors ml-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Mark All Read</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeTab === 'ACTIONS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <span>Actions Due</span>
                {actionRequiredCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-white text-amber-600 dark:bg-amber-900 dark:text-white">
                    {actionRequiredCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ORDERS')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'ORDERS'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Orders
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('INVENTORY')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'INVENTORY'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Inventory
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PARTNERS')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'PARTNERS'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Partners & Quotes
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. NOTIFICATION LIST */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 max-h-[55vh] custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 mx-auto flex items-center justify-center mb-3">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All Operations Clear</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  {activeTab === 'ACTIONS'
                    ? 'No urgent actions pending administrative decision right now.'
                    : 'No notifications in this filter category.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => {
                const isCritical = item.severity === 'CRITICAL';
                const isWarning = item.severity === 'WARNING';

                return (
                  <div
                    key={item.id}
                    className={`group relative p-3 rounded-xl border transition-all ${
                      !item.isRead
                        ? isCritical
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 shadow-2xs'
                          : isWarning
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 shadow-2xs'
                          : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon Avatar */}
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${
                          isCritical
                            ? 'bg-rose-100/80 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                            : isWarning
                            ? 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {getNotificationIcon(item)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                            )}
                          </div>

                          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Action CTA & Mark as Read */}
                        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/60">
                          {item.actionRequired && item.actionUrl ? (
                            <button
                              type="button"
                              onClick={() => handleActionClick(item)}
                              disabled={actionInProgressId === item.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-2xs ${
                                isCritical
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : isWarning
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white'
                              }`}
                            >
                              <span>{item.actionLabel || 'Take Action'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
                              {item.category}
                            </span>
                          )}

                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={e => handleMarkAsRead(item.id, e)}
                              title="Mark as read"
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Done</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================================= */}
          {/* 4. FOOTER */}
          {/* ========================================================================= */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="font-mono text-[10.5px]">
              {actionRequiredCount} urgent item{actionRequiredCount === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/orders"
                onClick={() => setIsOpen(false)}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
              >
                Orders
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link
                href="/admin/purchase-orders"
                onClick={() => setIsOpen(false)}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
              >
                Stock Reorders
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
