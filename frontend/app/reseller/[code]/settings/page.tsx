'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Reseller } from '@/types';
import {
  Settings,
  Building2,
  MapPin,
  Save,
  CheckCircle2,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function ResellerSettingsPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token, role } = useAuth();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [form, setForm] = useState({
    businessName: 'ComNet Solutions Middle East LLC',
    displayName: 'ComNet Hardware & Enterprise Systems',
    tradeLicenseNumber: 'DET-DXB-984021',
    taxRegistrationNumber: '100293847500003',
    email: 'procurement@comnet.ae',
    phone: '+971 4 399 2211',
    website: 'https://comnet.ae',
    addressLine1: 'Al Quoz Industrial Area 3, Warehouse 18',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    postalCode: '11223',
    dispatchHub: 'JAFZA South Logistics Hub',
  });

  useEffect(() => {
    if (token) {
      ApiClient.get<Reseller>('/reseller/profile', { token, params: { resellerCode } })
        .then(res => {
          if (res) {
            const biz = res.businessInformation as any;
            setForm(prev => ({
              ...prev,
              businessName: res.businessName || prev.businessName,
              displayName: res.displayName || prev.displayName,
              email: res.email || prev.email,
              phone: res.phone || prev.phone,
              tradeLicenseNumber: biz?.tradeLicense || biz?.tradeLicenseNumber || prev.tradeLicenseNumber,
              taxRegistrationNumber: biz?.taxRegistrationNumber || biz?.trn || prev.taxRegistrationNumber,
              addressLine1: res.address?.addressLine1 || prev.addressLine1,
              city: res.address?.city || prev.city,
              state: res.address?.state || prev.state,
              country: res.address?.country || prev.country,
              postalCode: res.address?.postalCode || prev.postalCode,
            }));
          }
        })
        .catch(err => console.error(err));
    }
  }, [token, resellerCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      await ApiClient.put(
        '/reseller/profile',
        {
          displayName: form.displayName,
          businessName: form.businessName,
          phone: form.phone,
          address: {
            addressLine1: form.addressLine1,
            city: form.city,
            state: form.state,
            country: form.country,
            postalCode: form.postalCode,
          },
          businessInformation: {
            tradeLicenseNumber: form.tradeLicenseNumber,
            taxRegistrationNumber: form.taxRegistrationNumber,
          },
        },
        { token }
      );
      setSuccessMsg('Vendor profile and compliance credentials successfully saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await ApiClient.post(
        '/auth/change-password',
        { currentPassword, newPassword },
        { token }
      );
      setPasswordSuccess('Your vendor portal password has been successfully updated! You can use this new password for subsequent logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 6000);
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Vendor Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-amber-500" />
          <span>Vendor Storefront & Compliance Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Maintain your verified UAE commercial trade license, VAT tax registration, and physical dispatch coordinates.
        </p>
      </div>

      {/* Admin Supervisory Access Notice */}
      {role === 'ADMIN' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-black text-slate-900">Master Administrator Direct Portal Access Active</div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              As a platform administrator, you have full supervisory authority over this vendor portal. Reseller password changes do not affect your ability to inspect, monitor, or manage this account from the admin console.
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        {/* 1. Verified Company Identity */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Commercial Entity Registration</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Partner ✓
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Official Registered Corporate Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={e => setForm({ ...form, businessName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Storefront Display Title *</label>
              <input
                type="text"
                required
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">UAE Commercial Trade License #</label>
              <input
                type="text"
                value={form.tradeLicenseNumber}
                onChange={e => setForm({ ...form, tradeLicenseNumber: e.target.value })}
                className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Federal Tax Authority TRN (15-digit VAT)</label>
              <input
                type="text"
                value={form.taxRegistrationNumber}
                onChange={e => setForm({ ...form, taxRegistrationNumber: e.target.value })}
                className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Dispatch Warehouse Address */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Physical Warehouse & Logistics Pickup Node</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Warehouse Street Address & Unit #</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={e => setForm({ ...form, addressLine1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">City / Emirate</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Country</label>
              <input
                type="text"
                disabled
                value={form.country}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 3. Official Contact Coordinates */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Operations Contact Coordinates</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Operations Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Disbursement / Emergency Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button for Profile */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings & Verification Data'}</span>
          </button>
        </div>
      </form>

      {/* 4. Portal Access & Security (Update Password) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Portal Access & Security (Change Password)</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Update the password for your vendor portal login. You may change this credential at any time. Platform administrators maintain independent supervisory access in accordance with enterprise SLAs.
        </p>

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">New Password (min 8 chars) *</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Password updates take effect immediately on next login.</span>
            </div>
            <button
              type="submit"
              disabled={passwordSaving || !newPassword || !currentPassword}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>{passwordSaving ? 'Updating Password...' : 'Update Portal Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
