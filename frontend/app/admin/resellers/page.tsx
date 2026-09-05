'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Reseller } from '@/types';
import {
  Store,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Search,
  Sparkles,
  Building2,
  Hash,
  Globe,
  User,
  Mail,
  Phone,
  Percent,
  MapPin,
  X
} from 'lucide-react';

export default function AdminResellersPage() {
  const { token } = useAuth();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating new reseller
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resellerCode, setResellerCode] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Dubai');
  const [commissionRate, setCommissionRate] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchResellers = () => {
    if (token) {
      ApiClient.get<Reseller[]>('/admin/resellers', { token })
        .then(res => setResellers(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchResellers();
  }, [token]);

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await ApiClient.post(
        '/admin/resellers',
        {
          businessName,
          displayName: displayName || businessName,
          username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
          email: email.toLowerCase().trim(),
          phone,
          resellerCode: resellerCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
          subdomain: (subdomain || resellerCode).toLowerCase().replace(/[^a-z0-9]/g, ''),
          commissionRate: Number(commissionRate),
          address: {
            fullName: displayName || businessName,
            phone,
            addressLine1: addressLine || 'Silicon Oasis Tech Park',
            city,
            state: 'Dubai',
            country: 'United Arab Emirates',
            postalCode: '00000',
          },
          businessInformation: {
            taxNumber,
            tradeLicense: 'DED-99281',
          },
        },
        { token: token || undefined }
      );

      setModalOpen(false);
      // Reset form
      setBusinessName('');
      setDisplayName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setResellerCode('');
      setSubdomain('');
      setTaxNumber('');
      setAddressLine('');
      fetchResellers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create reseller account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (reseller: Reseller) => {
    if (!token) return;
    const nextStatus = reseller.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await ApiClient.put(`/admin/resellers/${reseller.id}/status`, { status: nextStatus }, { token });
      fetchResellers();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = resellers.filter(r =>
    r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.resellerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Multi-Tenant Vendor Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-amber-500" />
            Authorized Technology Reseller Accounts
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Provision isolated vendor subdomains (<code>*.store.com</code>), commission structures, and Excel bulk-upload privileges.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-tech transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Reseller</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search resellers by business name, unique code, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
          {filtered.length} Active Vendors
        </div>
      </div>

      {/* Reseller Accounts Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3 min-w-[220px]">Business Entity</th>
                <th className="py-3 px-3 min-w-[130px]">Unique Code</th>
                <th className="py-3 px-3 min-w-[180px]">Subdomain URL</th>
                <th className="py-3 px-3 text-center min-w-[90px] whitespace-nowrap">Products</th>
                <th className="py-3 px-3 text-right min-w-[130px] whitespace-nowrap">Vendor Sales</th>
                <th className="py-3 px-3 text-center min-w-[100px] whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-right min-w-[140px] whitespace-nowrap">Storefront Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{r.businessName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.email} • {r.phone}</div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{r.resellerCode}</td>
                  <td className="py-4 px-3 font-mono text-purple-600 dark:text-purple-300 font-semibold">
                    {r.subdomain}.store.com
                  </td>
                  <td className="py-4 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-300">
                    {r.productCount || 0} listings
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(r.salesStats?.totalRevenue || 0)}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        r.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right space-x-2">
                    <Link
                      href={`/reseller/${r.resellerCode}/dashboard`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg font-bold text-[11px] transition-colors border border-amber-500/30"
                    >
                      <span>Open Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => handleStatusToggle(r)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {r.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Reseller Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-sm shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Provision Technology Reseller</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Multi-Tenant
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Deploy vendor subdomain, configure commission rate, and set up store portal access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReseller} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs custom-scrollbar">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Business Entity Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Business Name (Legal Entity)</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hardware Technologies LLC"
                    value={businessName}
                    onChange={e => {
                      setBusinessName(e.target.value);
                      if (!resellerCode) {
                        setResellerCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10));
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Reseller Code & Subdomain Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unique Reseller Code</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex101"
                    value={resellerCode}
                    onChange={e => setResellerCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-amber-600 dark:text-amber-400 font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-500" />
                    <span>Subdomain Slug</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex101"
                    value={subdomain || resellerCode}
                    onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-purple-600 dark:text-purple-400 font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Admin Username & Contact Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Admin Username</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex_admin"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Contact Email</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sales@apextech.ae"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Phone Number & Commission Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Phone Number</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +971 50 123 4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-mono placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-pink-500" />
                    <span>Platform Commission (%)</span>
                  </label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Warehouse Address */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  <span>Warehouse Address & City</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al Quoz Industrial Area 4, Warehouse 12, Dubai"
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs placeholder:text-slate-400"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Provisioning...' : 'Confirm & Create Reseller'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

