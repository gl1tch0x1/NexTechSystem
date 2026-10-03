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
  Mail
} from 'lucide-react';

export default function ResellerSettingsPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

        {/* Submit Button */}
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
    </div>
  );
}
