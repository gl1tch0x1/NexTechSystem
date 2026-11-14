'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStaffPresence } from '@/lib/useStaffPresence';
import {
  Users,
  ShieldCheck,
  Edit3,
  Store,
  ChevronDown,
  Search,
  RefreshCw,
  Activity,
  X
} from 'lucide-react';

/**
 * Validates and sanitizes image URLs to prevent DOM-based XSS (CWE-79 / js/xss-through-dom).
 * Strictly complies with CodeQL's MetacharEscapeSanitizer and UriEncodingSanitizer.
 */
function getSafeImageUrl(url: unknown, fallback: string = ''): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (/^(javascript|vbscript|data:(?!image\/))/i.test(trimmed)) {
    return fallback;
  }

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    try {
      const parsed = new URL(trimmed, 'https://nextech.local');
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    } catch {
      if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    }
  }

  return fallback;
}

export function OnlineStaffPill() {
  const { onlineStaff, onlineCount, isLoading, refreshPresence } = useStaffPresence();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Role counters
  const adminCount = onlineStaff.filter(s => s.role === 'ADMIN').length;
  const editorCount = onlineStaff.filter(s => s.role === 'PRODUCT_EDITOR').length;
  const resellerCount = onlineStaff.filter(s => s.role === 'RESELLER').length;

  // Filtered members
  const filteredStaff = onlineStaff.filter(staff => {
    const matchesTab = activeTab === 'ALL' || staff.role === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      staff.name.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      staff.username.toLowerCase().includes(q) ||
      staff.currentPath.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Administrator</span>
          </span>
        );
      case 'PRODUCT_EDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Product Editor</span>
          </span>
        );
      case 'RESELLER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Reseller</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatPath = (path: string) => {
    if (!path) return 'Active';
    if (path === '/admin') return 'Command Center';
    if (path.includes('/admin/orders')) return 'Sales Orders';
    if (path.includes('/admin/products')) return 'Hardware Catalog';
    if (path.includes('/admin/admins')) return 'Admin Governance';
    if (path.includes('/admin/editors')) return 'Staff Editors';
    if (path.includes('/admin/resellers')) return 'Reseller Desk';
    if (path.includes('/admin/quotes')) return 'Quotes Engine';
    if (path.includes('/admin/settings')) return 'Store Settings';
    if (path.includes('/reseller/')) return 'Reseller Portal';
    return path.replace(/^\//, '');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View online staff and resellers"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer select-none ${
          isOpen
            ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 shadow-sm'
            : 'bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
        }`}
        title="View live active administrators, product editors, and resellers"
      >
        {/* Pulsing Green Online Radar Indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Text count */}
        <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
          <span>{onlineCount}</span>
          <span className="hidden sm:inline font-sans text-slate-600 dark:text-slate-300">
            Online
          </span>
        </span>

        {/* Small avatar stack preview (up to 3) */}
        {onlineStaff.length > 0 && (
          <div className="hidden lg:flex items-center -space-x-1.5 pl-0.5">
            {onlineStaff.slice(0, 3).map((staff, i) => (
              <div
                key={staff.id || i}
                className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center overflow-hidden shrink-0"
                title={`${staff.name} (${staff.role})`}
              >
                {staff.avatar ? (
                  <img src={getSafeImageUrl(staff.avatar)} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  staff.name.slice(0, 1).toUpperCase()
                )}
              </div>
            ))}
          </div>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Live Active Personnel
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      {onlineCount}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Staff & Reseller sessions active in the last 3 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => refreshPresence()}
                  disabled={isLoading}
                  title="Refresh presence"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 pt-1 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                All ({onlineCount})
              </button>
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  activeTab === 'ADMIN'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Admins ({adminCount})
              </button>
              <button
                onClick={() => setActiveTab('PRODUCT_EDITOR')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  activeTab === 'PRODUCT_EDITOR'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                Editors ({editorCount})
              </button>
              <button
                onClick={() => setActiveTab('RESELLER')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  activeTab === 'RESELLER'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Store className="w-3 h-3" />
                Resellers ({resellerCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or page..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {filteredStaff.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No active personnel found
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {searchQuery ? 'Try matching another name or filter.' : 'Only authorized staff & resellers are tracked.'}
                </div>
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id || staff.userId}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3"
                >
                  {/* Avatar with Live Indicator */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                      {staff.avatar ? (
                        <img src={getSafeImageUrl(staff.avatar)} alt={staff.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}</span>
                      )}
                    </div>
                    {/* Live Online Badge */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        staff.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      title={staff.status === 'ONLINE' ? 'Active Now' : 'Away (Idle)'}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {staff.name}
                      </div>
                      {getRoleBadge(staff.role)}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {staff.email || `@${staff.username}`}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="truncate max-w-[170px]" title={staff.currentPath}>
                        {formatPath(staff.currentPath)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {staff.status === 'ONLINE' ? 'Active' : 'Away'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Popover Footer Links */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href="/admin/admins"
              onClick={() => setIsOpen(false)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admins</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/admin/editors"
              onClick={() => setIsOpen(false)}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editors</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/admin/resellers"
              onClick={() => setIsOpen(false)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Resellers</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
