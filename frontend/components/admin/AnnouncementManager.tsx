'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TopAnnouncementBar, HeaderNotification } from '@/components/layout/TopAnnouncementBar';
import type { StoreSettings } from '@/types';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Truck,
  Zap,
  Sparkles,
  Bell,
  Info,
  ChevronUp,
  ChevronDown,
  Eye,
  ExternalLink,
  Save,
  X,
  Timer,
  Loader2
} from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'flame', label: 'Fire / Deal', icon: Flame, color: 'text-amber-500' },
  { id: 'truck', label: 'Logistics / Shipping', icon: Truck, color: 'text-blue-500' },
  { id: 'zap', label: 'Lightning / Flash', icon: Zap, color: 'text-yellow-500' },
  { id: 'sparkles', label: 'Sparkles / New', icon: Sparkles, color: 'text-cyan-500' },
  { id: 'clock', label: 'Clock / Limited', icon: Clock, color: 'text-rose-500' },
  { id: 'bell', label: 'Bell / Alert', icon: Bell, color: 'text-emerald-500' },
  { id: 'info', label: 'Info / Notice', icon: Info, color: 'text-slate-400' },
];

const PREFIX_PRESETS = [
  'GCC EXPRESS DISPATCH:',
  'LIMITED TIME OFFER:',
  'FLASH PROMO:',
  'ENTERPRISE NOTICE:',
  'RESTOCK ALERT:',
  'NEW HARDWARE ARRIVAL:',
  'FREE SHIPPING:',
];

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function AnnouncementManager() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Announcement bar state
  const [isAnnouncementActive, setIsAnnouncementActive] = useState<boolean>(true);
  const [rotationSeconds, setRotationSeconds] = useState<number>(5);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formPrefix, setFormPrefix] = useState('GCC EXPRESS DISPATCH:');
  const [formText, setFormText] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formIcon, setFormIcon] = useState<'flame' | 'truck' | 'zap' | 'sparkles' | 'clock' | 'bell' | 'info'>('flame');
  const [formIsActive, setFormIsActive] = useState(true);
  const [timerMode, setTimerMode] = useState<'continuous' | 'limited'>('continuous');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formShowCountdown, setFormShowCountdown] = useState(false);
  const [formValidationError, setFormValidationError] = useState('');

  const wordCount = useMemo(() => countWords(formText), [formText]);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load announcements');
      const json = await res.json();
      const data = json.data;
      if (data) {
        setIsAnnouncementActive(data.isAnnouncementActive ?? true);
        setRotationSeconds(data.notificationRotationSeconds || 5);
        setNotifications(data.headerNotifications || []);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Error loading announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage(type, message);
  };

  const setToastMessage = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormPrefix('GCC EXPRESS DISPATCH:');
    setFormText('');
    setFormLink('');
    setFormIcon('flame');
    setFormIsActive(true);
    setTimerMode('continuous');
    setFormStartDate('');
    setFormEndDate('');
    setFormShowCountdown(false);
    setFormValidationError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (n: HeaderNotification) => {
    setEditingId(n.id);
    setFormPrefix(n.prefix || '');
    setFormText(n.text || '');
    setFormLink(n.link || '');
    setFormIcon(n.icon || 'flame');
    setFormIsActive(n.isActive !== false);
    setTimerMode(n.endDate ? 'limited' : 'continuous');
    setFormStartDate(n.startDate ? n.startDate.slice(0, 16) : '');
    setFormEndDate(n.endDate ? n.endDate.slice(0, 16) : '');
    setFormShowCountdown(Boolean(n.showCountdown));
    setFormValidationError('');
    setIsModalOpen(true);
  };

  // Quick Preset Handlers for Timers
  const handleApplyTimerPreset = (hoursFromNow: number) => {
    setTimerMode('limited');
    const target = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    // Format to yyyy-MM-ddTHH:mm
    const iso = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormEndDate(iso);
    setFormShowCountdown(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      setFormValidationError('Notification text is required.');
      return;
    }

    const words = countWords(formText);
    if (words > 25) {
      setFormValidationError(`Word count exceeds 25 words (${words} words entered). Please shorten your message.`);
      return;
    }

    if (timerMode === 'limited' && !formEndDate) {
      setFormValidationError('Please select an expiration date and time, or switch to "Always Active".');
      return;
    }

    if (timerMode === 'limited' && formEndDate && new Date(formEndDate).getTime() <= Date.now()) {
      setFormValidationError('Expiration date/time must be in the future.');
      return;
    }

    let updatedList = [...notifications];

    const notificationPayload: HeaderNotification = {
      id: editingId || `notif_${Date.now()}`,
      prefix: formPrefix.trim(),
      text: formText.trim(),
      link: formLink.trim() || undefined,
      icon: formIcon,
      isActive: formIsActive,
      startDate: timerMode === 'limited' && formStartDate ? new Date(formStartDate).toISOString() : undefined,
      endDate: timerMode === 'limited' && formEndDate ? new Date(formEndDate).toISOString() : undefined,
      showCountdown: timerMode === 'limited' ? formShowCountdown : false,
      updatedAt: new Date().toISOString(),
      createdAt: editingId ? (notifications.find(n => n.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) {
      updatedList = updatedList.map(n => n.id === editingId ? notificationPayload : n);
    } else {
      updatedList.push(notificationPayload);
    }

    setNotifications(updatedList);
    setIsModalOpen(false);
  };

  // Delete notification
  const handleDeleteNotification = (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Duplicate notification
  const handleDuplicateNotification = (n: HeaderNotification) => {
    const copy: HeaderNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      text: `${n.text} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotifications([...notifications, copy]);
  };

  // Move Up/Down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= notifications.length) return;

    const copy = [...notifications];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setNotifications(copy);
  };

  // Toggle Single Notification Active
  const handleToggleSingleActive = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isActive: !n.isActive } : n));
  };

  // Save All Changes to Server
  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Validate all notifications word count <= 25
      for (let i = 0; i < notifications.length; i++) {
        const words = countWords(notifications[i].text);
        if (words > 25) {
          throw new Error(`Notification #${i + 1} exceeds 25 words limit (${words} words). Please shorten before saving.`);
        }
      }

      const payload = {
        isAnnouncementActive,
        notificationRotationSeconds: Number(rotationSeconds) || 5,
        headerNotifications: notifications,
      };

      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.message || 'Failed to save announcements');

      // Dispatch real-time update event so header immediately syncs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('store-settings-updated', {
          detail: {
            isAnnouncementActive,
            notificationRotationSeconds: Number(rotationSeconds) || 5,
            headerNotifications: notifications,
          }
        }));
      }

      showToast('success', 'Announcement notifications and rotation timers saved successfully!');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Error saving announcements');
    } finally {
      setSaving(false);
    }
  };

  // Live preview settings object
  const previewSettings: Partial<StoreSettings> = useMemo(() => ({
    isAnnouncementActive,
    notificationRotationSeconds: rotationSeconds,
    headerNotifications: notifications,
  }), [isAnnouncementActive, rotationSeconds, notifications]);

  // Compute status of a notification
  const getNotificationStatus = (n: HeaderNotification) => {
    if (!n.isActive) {
      return { label: 'Paused / Disabled', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' };
    }
    const nowMs = Date.now();
    if (n.startDate && new Date(n.startDate).getTime() > nowMs) {
      return { label: 'Scheduled (Future)', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    }
    if (n.endDate && new Date(n.endDate).getTime() < nowMs) {
      return { label: 'Timer Expired', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900' };
    }
    if (n.endDate) {
      return { label: 'Active with Timer', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900' };
    }
    return { label: 'Always Active', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header and Action Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                  Header Announcement Bar & Timers
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage multiple rotating short announcements (max 25 words) with custom scheduling and timers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Notification</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Rotation Speed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Display Announcement Bar
              </div>
              <div className="text-[11px] text-slate-500">
                Master switch to show/hide the top header banner on all storefront pages.
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Rotation Interval Slider */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-tech-blue" />
                <span>Rotation Timer Interval:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold ml-1">
                  {rotationSeconds}s
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Seconds between notification rotations when multiple alerts are active.
              </div>
            </div>

            <select
              value={rotationSeconds}
              onChange={(e) => setRotationSeconds(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
            >
              <option value={3}>3 Seconds (Fast)</option>
              <option value={5}>5 Seconds (Recommended)</option>
              <option value={8}>8 Seconds (Relaxed)</option>
              <option value={10}>10 Seconds (Slow)</option>
              <option value={15}>15 Seconds (Long)</option>
            </select>
          </div>
        </div>

        {/* Real-Time Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-tech-blue" />
              <span>Live Storefront Preview (Exact Rendering):</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              Hover to pause auto-rotation
            </span>
          </div>

          <div className="rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-md">
            <TopAnnouncementBar customSettings={previewSettings} previewMode={true} />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Configured Notifications</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {notifications.length}
            </span>
          </h2>
          <span className="text-[11px] text-slate-500">
            Order top-to-bottom determines display sequence in rotation
          </span>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-tech-blue" />
            <span>Loading announcement notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No custom notifications configured
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first short notification to showcase GCC shipping discounts, hardware flash sales, or limited-time events.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Notification</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item, index) => {
              const status = getNotificationStatus(item);
              const words = countWords(item.text);
              const IconComp = (item.icon && (ICON_OPTIONS.find(i => i.id === item.icon)?.icon)) || Flame;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.isActive
                      ? 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                      : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  {/* Left: Content & Meta */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Reorder Arrows */}
                    <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === notifications.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.prefix && (
                          <span className="font-extrabold font-mono text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                            {item.prefix}
                          </span>
                        )}

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${status.color}`}>
                          {status.label}
                        </span>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                          words <= 20
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                            : words <= 25
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 font-bold'
                        }`}>
                          {words}/25 Words {words <= 20 ? '(Optimal)' : ''}
                        </span>

                        {item.link && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[150px]">{item.link}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {item.text}
                      </div>

                      {/* Timer & Expiry notice */}
                      {item.endDate && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>
                            Expires: {new Date(item.endDate).toLocaleDateString()} at {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {item.showCountdown && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              • Live countdown enabled
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSingleActive(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Notification"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateNotification(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Duplicate Notification"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(item.id)}
                      className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT NOTIFICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingId ? 'Edit Announcement Notification' : 'Create New Announcement Notification'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Max 25 words limit • Optional limited timer expiration
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Form Validation Error Banner */}
              {formValidationError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Prefix field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Header Prefix Tag:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Shown in bold amber
                  </span>
                </div>

                <input
                  type="text"
                  value={formPrefix}
                  onChange={(e) => setFormPrefix(e.target.value)}
                  placeholder="e.g. GCC EXPRESS DISPATCH:"
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PREFIX_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPrefix(p)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message text with Word Counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Notification Message:
                  </label>
                  <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    wordCount <= 20
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : wordCount <= 25
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                  }`}>
                    {wordCount} / 25 Words Max
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Free Insured Shipping on Orders over AED 500 across UAE & GCC"
                  className={`w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white focus:outline-none ${
                    wordCount > 25
                      ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-tech-blue'
                  }`}
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Keep short and concise for optimal visibility on mobile screens.</span>
                  {wordCount <= 20 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Optimal length</span>
                  ) : wordCount <= 25 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">✓ Acceptable</span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">⚠ Shorten message to 25 words or fewer</span>
                  )}
                </div>
              </div>

              {/* Icon selector & Target Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Badge Icon:
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value as any)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Link */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Click Link URL (Optional):
                  </label>
                  <input
                    type="text"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="e.g. /products?featured=true"
                    className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue font-mono"
                  />
                </div>
              </div>

              {/* Timer & Expiration Configuration Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-tech-blue" />
                    <span>Notification Timer & Expiration Schedule</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimerMode('continuous')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        timerMode === 'continuous'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Always Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerMode('limited')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        timerMode === 'limited'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Set Limited Timer
                    </button>
                  </div>
                </div>

                {timerMode === 'limited' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
                    {/* Quick Preset Buttons */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Quick Expiration Presets:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyTimerPreset(2)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          +2 Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTimerPreset(6)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          +6 Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTimerPreset(24)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          +24 Hours (1 Day)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTimerPreset(72)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          +3 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTimerPreset(168)}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          +7 Days
                        </button>
                      </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Expiration Date & Time (Required):
                        </label>
                        <input
                          type="datetime-local"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Start Date & Time (Optional):
                        </label>
                        <input
                          type="datetime-local"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                        />
                      </div>
                    </div>

                    {/* Show Live Countdown Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="formShowCountdown"
                        checked={formShowCountdown}
                        onChange={(e) => setFormShowCountdown(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                      <label htmlFor="formShowCountdown" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Display live ticking countdown badge on storefront banner (e.g. ⏳ 02:45:10)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Status active checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-tech-blue focus:ring-tech-blue h-4 w-4"
                />
                <label htmlFor="formIsActive" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Notification is Active (Will rotate in storefront banner)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={wordCount > 25}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {editingId ? 'Save Changes' : 'Add to Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
