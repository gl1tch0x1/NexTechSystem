'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Reseller } from '@/types';
import {
  Store,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  Globe,
  User,
  X,
  Truck,
  Check,
  Layers
} from 'lucide-react';

export default function AdminResellersPage() {
  const { token } = useAuth();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Section 1: Corporate Legal & KYC
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [licenseJurisdiction, setLicenseJurisdiction] = useState('Dubai Economy and Tourism (DET / DED)');
  const [jurisdictions, setJurisdictions] = useState<string[]>([
    'Dubai Economy and Tourism (DET / DED)',
    'Abu Dhabi Department of Economic Development (ADDED)',
    'Dubai Multi Commodities Centre (DMCC Free Zone)',
    'Jebel Ali Free Zone Authority (JAFZA)',
    'Dubai Integrated Economic Zones (DIEZ / DAFZA)',
    'Dubai Development Authority (DDA Free Zone)',
    'Sharjah Media City (Shams)',
    'Ras Al Khaimah Economic Zone (RAKEZ)',
    'Saudi Arabia Ministry of Investment (MISA / CR)',
    'International Entity'
  ]);
  const [isAddingJurisdiction, setIsAddingJurisdiction] = useState(false);
  const [newJurisdictionInput, setNewJurisdictionInput] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('2028-12-31');

  // Section 2: Business Classification & Hardware Specializations
  const [businessType, setBusinessType] = useState('Value-Added Reseller (VAR)');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([
    'Enterprise Servers & Racks',
    'AI & Deep Learning Hardware',
    'High-Performance Workstations'
  ]);
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Section 3: Authorized Signatory & Access
  const [authorizedSignatory, setAuthorizedSignatory] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('Managing Director');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Section 4: Multi-Tenant Subdomain & Commercial Terms
  const [resellerCode, setResellerCode] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const city = 'Dubai';
  const [dispatchHub, setDispatchHub] = useState('Al Quoz Industrial Hub (Dubai)');
  const [dispatchHubs, setDispatchHubs] = useState<string[]>([
    'Al Quoz Industrial Hub (Dubai)',
    'Dubai South / DWC Logistics City',
    'JAFZA Freezone Cargo Terminal',
    'Musaffah Industrial Zone (Abu Dhabi)',
    'Sharjah Industrial Logistics District',
    'Vendor Direct Showroom Facility'
  ]);
  const [isAddingDispatchHub, setIsAddingDispatchHub] = useState(false);
  const [newDispatchHubInput, setNewDispatchHubInput] = useState('');
  const [commissionRate, setCommissionRate] = useState(8);
  const [settlementTerms, setSettlementTerms] = useState('Weekly Automatic Settlement');
  const [creditLimitAED, setCreditLimitAED] = useState(150000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSaveNewJurisdiction = () => {
    const trimmed = newJurisdictionInput.trim();
    if (!trimmed) return;
    if (!jurisdictions.includes(trimmed)) {
      setJurisdictions(prev => [...prev, trimmed]);
    }
    setLicenseJurisdiction(trimmed);
    setNewJurisdictionInput('');
    setIsAddingJurisdiction(false);
  };

  const handleSaveNewDispatchHub = () => {
    const trimmed = newDispatchHubInput.trim();
    if (!trimmed) return;
    if (!dispatchHubs.includes(trimmed)) {
      setDispatchHubs(prev => [...prev, trimmed]);
    }
    setDispatchHub(trimmed);
    setNewDispatchHubInput('');
    setIsAddingDispatchHub(false);
  };

  const availableSpecializations = [
    'Enterprise Servers & Racks',
    'AI & Deep Learning Hardware',
    'High-Performance Workstations',
    'Custom Liquid-Cooled Gaming Rigs',
    'Datacenter Networking & Cyber Infrastructure',
    'OEM Storage & Flash Arrays',
    'Commercial Displays & Audio-Visual',
    'Bulk Hardware Wholesale'
  ];

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const fetchResellers = () => {
    if (token) {
      ApiClient.get<Reseller[]>('/admin/resellers', { token })
        .then(res => setResellers(res || []))
        .catch(err => console.error(err))
;
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
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          email: email.toLowerCase().trim(),
          phone,
          password: password || undefined,
          resellerCode: resellerCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
          subdomain: (subdomain || resellerCode).toLowerCase().replace(/[^a-z0-9]/g, ''),
          commissionRate: Number(commissionRate),
          address: {
            fullName: displayName || businessName,
            phone,
            addressLine1: addressLine || 'Al Quoz Industrial Hub',
            city,
            state: 'Dubai',
            country: 'United Arab Emirates',
            postalCode: '00000',
          },
          businessInformation: {
            tradeLicense,
            licenseJurisdiction,
            taxNumber,
            licenseExpiryDate,
            businessType,
            specializations: selectedSpecializations,
            authorizedSignatory: authorizedSignatory || displayName || businessName,
            signatoryTitle,
            website,
            description,
            settlementTerms,
            creditLimitAED: Number(creditLimitAED),
            dispatchHub,
          },
        },
        { token: token || undefined }
      );

      setModalOpen(false);
      // Reset form
      setBusinessName('');
      setDisplayName('');
      setTradeLicense('');
      setTaxNumber('');
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setResellerCode('');
      setSubdomain('');
      setAddressLine('');
      setWebsite('');
      setDescription('');
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Multi-Tenant Vendor Ecosystem &amp; KYC Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-amber-500" />
            Authorized Technology Reseller Accounts
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Provision verified B2B vendors, custom subdomains (<code>*.store.com</code>), commission structures, and multi-tenant portal access.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-tech hover:shadow-purple-600/30 transition-all cursor-pointer"
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
            placeholder="Search resellers by business name, trade license, TRN, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">
          {filtered.length} {filtered.length === 1 ? 'Registered Vendor' : 'Registered Vendors'}
        </div>
      </div>

      {/* Reseller Accounts Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[960px] text-left text-xs border-collapse text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 min-w-[260px]">Corporate Entity &amp; KYC</th>
                <th className="py-3 px-3 min-w-[140px]">Unique Code</th>
                <th className="py-3 px-3 min-w-[180px]">Subdomain URL</th>
                <th className="py-3 px-3 text-center min-w-[90px] whitespace-nowrap">Catalog</th>
                <th className="py-3 px-3 text-right min-w-[130px] whitespace-nowrap">Gross Volume</th>
                <th className="py-3 px-3 text-center min-w-[100px] whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-right min-w-[220px] whitespace-nowrap">Portal Access &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors">
                  <td className="py-4 px-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-purple-500/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{r.businessName}</span>
                          {r.businessInformation?.businessType && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                              {r.businessInformation.businessType}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span>{r.email}</span>
                          <span>•</span>
                          <span>{r.phone}</span>
                          {r.businessInformation?.tradeLicense && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                                TL: {r.businessInformation.tradeLicense}
                              </span>
                            </>
                          )}
                          {r.businessInformation?.taxNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                                TRN: {r.businessInformation.taxNumber}
                              </span>
                            </>
                          )}
                        </div>
                        {r.businessInformation?.specializations && r.businessInformation.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {r.businessInformation.specializations.slice(0, 3).map((spec, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {spec}
                              </span>
                            ))}
                            {r.businessInformation.specializations.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-medium">
                                +{r.businessInformation.specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
                  <td className="py-4 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/reseller/${r.resellerCode}/dashboard`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-sm transition-all hover:shadow cursor-pointer"
                      >
                        <span>Open Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(r)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                          r.status === 'ACTIVE'
                            ? 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        }`}
                      >
                        {r.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENHANCED PROVISION RESELLER MODAL (4-SECTION ENTERPRISE ONBOARDING) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 via-transparent to-transparent shrink-0">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 pr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shadow-inner shrink-0">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                      Provision Technology Reseller
                    </h3>
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
                      Enterprise Multi-Tenant
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Corporate entity KYC verification, hardware specializations, multi-tenant portal subdomain, and automated settlement SLA.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateReseller} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 text-xs custom-scrollbar">
              {formError && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION 1: CORPORATE LEGAL IDENTITY & KYC */}
              <div className="space-y-3.5 sm:space-y-4 p-3.5 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    1. Corporate Legal Identity &amp; Tax Compliance (KYC)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Legal Business Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Hardware Technologies LLC"
                      value={businessName}
                      onChange={e => {
                        setBusinessName(e.target.value);
                        if (!resellerCode) {
                          setResellerCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8));
                        }
                        if (!subdomain) {
                          setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Commercial Brand / Storefront Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Tech Solutions"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Licensing & Regulatory Authority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Trade License / CR Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TL-DXB-948210"
                      value={tradeLicense}
                      onChange={e => setTradeLicense(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Issuing Jurisdiction &amp; Authority *</span>
                      </label>
                      {!isAddingJurisdiction ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingJurisdiction(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Add Custom</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingJurisdiction(false);
                            setNewJurisdictionInput('');
                          }}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">ESC</span>
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    {!isAddingJurisdiction ? (
                      <select
                        value={licenseJurisdiction}
                        onChange={e => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingJurisdiction(true);
                          } else {
                            setLicenseJurisdiction(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer text-xs"
                      >
                        <optgroup label="UAE Mainland & Federal Authorities">
                          {jurisdictions.filter(j => j.includes('DET') || j.includes('ADDED') || j.includes('SEDD') || j.includes('Economy')).map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </optgroup>
                        <optgroup label="UAE Free Zone & Regional Authorities">
                          {jurisdictions.filter(j => !j.includes('DET') && !j.includes('ADDED') && !j.includes('SEDD') && !j.includes('Economy')).map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </optgroup>
                        <option value="__ADD_NEW__" className="text-purple-600 font-bold bg-purple-50 dark:bg-purple-950">
                          + Register Custom Authority...
                        </option>
                      </select>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 shadow-xs space-y-2.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Register Custom Licensing Authority
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingJurisdiction(false);
                              setNewJurisdictionInput('');
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Sharjah Publishing City Free Zone (SPC FZ)"
                          value={newJurisdictionInput}
                          onChange={e => setNewJurisdictionInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewJurisdiction();
                            } else if (e.key === 'Escape') {
                              setIsAddingJurisdiction(false);
                              setNewJurisdictionInput('');
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder:text-slate-400"
                        />

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-mono font-bold">↵ Enter</kbd> to save
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingJurisdiction(false);
                                setNewJurisdictionInput('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveNewJurisdiction}
                              disabled={!newJurisdictionInput.trim()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save &amp; Select</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Tax TRN & Expiry Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Tax Registration (15-Digit TRN)
                    </label>
                    <input
                      type="text"
                      placeholder="100382910400003"
                      value={taxNumber}
                      onChange={e => setTaxNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={licenseExpiryDate}
                      onChange={e => setLicenseExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: BUSINESS CLASSIFICATION & HARDWARE FOCUS */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    2. Organization Classification &amp; Hardware Specializations
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Reseller Partnership Tier / Model
                    </label>
                    <select
                      value={businessType}
                      onChange={e => setBusinessType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="Value-Added Reseller (VAR)">Value-Added Reseller (VAR)</option>
                      <option value="Enterprise System Integrator (SI)">Enterprise System Integrator (SI)</option>
                      <option value="Authorized OEM Distributor">Authorized OEM Distributor</option>
                      <option value="Custom PC Builder & Boutique Integrator">Custom PC Builder &amp; Boutique Integrator</option>
                      <option value="Wholesale Hardware Distributor">Wholesale Hardware Distributor</option>
                      <option value="Retail Computer Hardware Showroom">Retail Computer Hardware Showroom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Official Corporate Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://apextech.ae"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Interactive Specialization Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Primary Hardware Specializations &amp; Catalog Domains
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSpecializations.map((spec) => {
                      const isSelected = selectedSpecializations.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialization(spec)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Organization Overview &amp; Commercial Scope
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of hardware expertise, warranty capabilities, and enterprise service facilities..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 3: AUTHORIZED SIGNATORY & ADMIN ACCESS */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    3. Authorized Corporate Signatory &amp; Admin Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Authorized Signatory Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Al-Mansoor"
                      value={authorizedSignatory}
                      onChange={e => setAuthorizedSignatory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Signatory Executive Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director"
                      value={signatoryTitle}
                      onChange={e => setSignatoryTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Corporate Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sales@apextech.ae"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Direct Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +971 4 380 4400"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Vendor Portal Admin Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. apex_admin"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Initial Passphrase (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for auto-passphrase"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: MULTI-TENANT SUBDOMAIN & COMMERCIAL TERMS */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    4. Multi-Tenant Subdomain, Logistics Hub &amp; Settlement SLA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Subdomain Slug with Live Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Subdomain Slug *
                      </label>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                        https://{(subdomain || 'partner').toLowerCase()}.store.com
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. apex101"
                        value={subdomain}
                        onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Unique Reseller Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. apex101"
                      value={resellerCode}
                      onChange={e => setResellerCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Warehouse / Showroom Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Al Quoz Industrial Area 4, Warehouse 12"
                      value={addressLine}
                      onChange={e => setAddressLine(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Fulfillment &amp; Regional Dispatch Hub</span>
                      </label>
                      {!isAddingDispatchHub ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingDispatchHub(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Add Custom</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingDispatchHub(false);
                            setNewDispatchHubInput('');
                          }}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">ESC</span>
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    {!isAddingDispatchHub ? (
                      <select
                        value={dispatchHub}
                        onChange={e => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingDispatchHub(true);
                          } else {
                            setDispatchHub(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer text-xs"
                      >
                        {dispatchHubs.map(hub => (
                          <option key={hub} value={hub}>{hub}</option>
                        ))}
                        <option value="__ADD_NEW__" className="text-purple-600 font-bold bg-purple-50 dark:bg-purple-950">
                          + Register Custom Dispatch Hub...
                        </option>
                      </select>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 shadow-xs space-y-2.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Register Custom Regional Hub
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingDispatchHub(false);
                              setNewDispatchHubInput('');
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Riyadh Dry Port & Logistics Terminal"
                          value={newDispatchHubInput}
                          onChange={e => setNewDispatchHubInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewDispatchHub();
                            } else if (e.key === 'Escape') {
                              setIsAddingDispatchHub(false);
                              setNewDispatchHubInput('');
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder:text-slate-400"
                        />

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-mono font-bold">↵ Enter</kbd> to save
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingDispatchHub(false);
                                setNewDispatchHubInput('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveNewDispatchHub}
                              disabled={!newDispatchHubInput.trim()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save &amp; Select</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Platform Commission (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={commissionRate}
                      onChange={e => setCommissionRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Settlement &amp; Payout SLA
                    </label>
                    <select
                      value={settlementTerms}
                      onChange={e => setSettlementTerms(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="Weekly Automatic Settlement">Weekly Automatic Settlement</option>
                      <option value="Bi-Weekly Automated Clearing">Bi-Weekly Automated Clearing</option>
                      <option value="Monthly Net 30 Consolidated">Monthly Net 30 Consolidated</option>
                      <option value="Real-Time Instant Escrow Release">Real-Time Instant Escrow Release</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Credit Limit Allocation (AED)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={creditLimitAED}
                      onChange={e => setCreditLimitAED(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{isSubmitting ? 'Provisioning Reseller...' : 'Confirm & Create Reseller'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
