'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Phone,
  Check,
  X,
  ShieldAlert,
  Camera
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminAdminsPage() {
  const { user: currentAdmin, token } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Toggle Loading ID
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<AdminUser[]>('/admin/admins', { token: token || undefined });
      if (res && Array.isArray(res)) {
        setAdmins(res);
      } else {
        setAdmins([]);
      }
    } catch (err: any) {
      console.warn('[Admin Roster Notice]:', err.message);
      setAdmins([]);
      setToastMessage({ type: 'error', text: err.message || 'Failed to fetch administrator accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB.');
      return;
    }

    try {
      setAvatarUploading(true);
      setFormError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload profile image.');
      }

      setAvatar(data.url);
    } catch (err: any) {
      setFormError(err.message || 'Error uploading image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ApiClient.post<any>('/admin/admins', {
        name: name.trim(),
        email: email.trim(),
        username: username.trim() || email.trim().split('@')[0],
        password: password.trim(),
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || undefined,
      }, { token: token || undefined });

      const createdAdmin = res?.data || res;
      setToastMessage({
        type: 'success',
        text: `Administrator "${name}" created successfully with full administrative permissions.`,
      });
      setIsAddModalOpen(false);
      // Reset form
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setPhone('');
      setAvatar('');
      if (createdAdmin && createdAdmin.id) {
        setAdmins(prev => [...prev.filter(a => a.id !== createdAdmin.id), createdAdmin]);
      }
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.id === currentAdmin?.id) {
      setToastMessage({ type: 'error', text: 'You cannot deactivate your own administrative account.' });
      return;
    }

    try {
      setTogglingId(admin.id);
      const res = await ApiClient.put<any>(`/admin/admins/${admin.id}/status`, {}, { token: token || undefined });
      const updatedAdmin = res?.data || res;
      const newStatus = updatedAdmin?.isActive !== undefined ? updatedAdmin.isActive : !admin.isActive;
      setToastMessage({
        type: 'success',
        text: `Administrator ${admin.name} is now ${newStatus ? 'Active' : 'Suspended'}.`,
      });
      setAdmins(prev =>
        prev.map(a => (a.id === admin.id ? { ...a, isActive: newStatus } : a))
      );
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to toggle status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    if (deletingAdmin.id === currentAdmin?.id) {
      setToastMessage({ type: 'error', text: 'You cannot delete your own administrative account.' });
      setDeletingAdmin(null);
      return;
    }

    try {
      setIsDeleting(true);
      await ApiClient.delete<any>(`/admin/admins/${deletingAdmin.id}`, { token: token || undefined });
      setToastMessage({
        type: 'success',
        text: `Administrator "${deletingAdmin.name}" has been permanently removed.`,
      });
      setAdmins(prev => prev.filter(a => a.id !== deletingAdmin.id));
      setDeletingAdmin(null);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to remove administrator.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? admin.isActive
        : !admin.isActive;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-slideDown ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Administrator Accounts & Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Create and manage co-administrators with full identical roles and permissions across catalog, orders, and system settings.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Administrator</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search administrators by name, email, or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Admins' : tab === 'ACTIVE' ? 'Active' : 'Suspended'}
            </button>
          ))}
          <button
            onClick={fetchAdmins}
            title="Refresh list"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Administrator Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Administrators Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No administrator accounts match your search filter.'
              : 'Add your first co-administrator to manage the store collaboratively.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins.map(admin => {
            const isSelf = admin.id === currentAdmin?.id;

            return (
              <div
                key={admin.id}
                className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-lg ${
                  isSelf
                    ? 'border-blue-500/50 dark:border-cyan-500/50 shadow-blue-500/5'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                        {admin.avatar ? (
                          <img src={admin.avatar} alt={admin.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{admin.name.slice(0, 2).toUpperCase()}</span>
                        )}
                        {admin.isActive && (
                          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={admin.name}>
                            {admin.name}
                          </h3>
                          {isSelf && (
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 truncate block">
                          @{admin.username}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                        admin.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {admin.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{admin.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Role: System Administrator (Full Access)</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400">
                    Added {new Date(admin.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Status */}
                    <button
                      disabled={isSelf || togglingId === admin.id}
                      onClick={() => handleToggleStatus(admin)}
                      title={isSelf ? 'Cannot deactivate your own account' : admin.isActive ? 'Suspend Administrator' : 'Activate Administrator'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : admin.isActive
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      }`}
                    >
                      {togglingId === admin.id ? 'Saving…' : admin.isActive ? 'Suspend' : 'Activate'}
                    </button>

                    {/* Delete Admin */}
                    <button
                      disabled={isSelf}
                      onClick={() => setDeletingAdmin(admin)}
                      title={isSelf ? 'Cannot delete your own account' : 'Remove Administrator'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed text-slate-400'
                          : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 cursor-pointer'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Administrator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Administrator</h2>
                  <p className="text-xs text-slate-400">Co-administrators receive identical roles and system permissions.</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notice */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* Profile Image / Avatar Picker */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                <div className="relative w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden border border-blue-400/30 shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : name ? (
                    <span>{name.slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <User className="w-6 h-6 text-white/80" />
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Profile Avatar / Picture
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-500" />
                      <span>{avatar ? 'Change Image' : 'Upload Image'}</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="text-xs text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste image URL (https://...)"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={e => {
                        setName(e.target.value);
                        if (!username) {
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Username <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="sarah_admin"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@comnet-cni.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+971 4 393 8050"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] font-mono font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sovereign Permission Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-cyan-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                  <span>Full Administrative Role Granted</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  This user will have identical full administrative permissions across products, categories, orders, customers, financial analytics, and system configurations.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Administrator...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revoke Administrative Access?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to remove administrator <strong className="text-slate-900 dark:text-white">{deletingAdmin.name}</strong> ({deletingAdmin.email})? They will immediately lose access to the administrative dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAdmin}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
