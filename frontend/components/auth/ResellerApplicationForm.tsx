'use client';

import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  MapPin,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe,
  Layers,
  Truck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { PhoneCountryField, COUNTRY_CODES, formatInternationalPhone, type CountryCode } from './PhoneCountryField';

const BUSINESS_TYPES = [
  'Value-Added Reseller (VAR)',
  'Enterprise System Integrator (SI)',
  'Authorized Distributor',
  'Wholesale Hardware Partner',
  'Managed Service Provider (MSP)',
  'OEM Channel Partner',
];

const JURISDICTIONS = [
  'Dubai Economy and Tourism (DET / DED)',
  'Abu Dhabi Department of Economic Development (ADDED)',
  'Dubai Multi Commodities Centre (DMCC Free Zone)',
  'Jebel Ali Free Zone Authority (JAFZA)',
  'Dubai Integrated Economic Zones (DIEZ / DAFZA)',
  'Dubai Development Authority (DDA Free Zone)',
  'Sharjah Media City (Shams)',
  'Ras Al Khaimah Economic Zone (RAKEZ)',
  'Saudi Arabia Ministry of Investment (MISA / CR)',
  'International Entity',
];

const DISPATCH_HUBS = [
  'Al Quoz Industrial Hub (Dubai)',
  'Dubai South / DWC Logistics City',
  'JAFZA Freezone Cargo Terminal',
  'Musaffah Industrial Zone (Abu Dhabi)',
  'Sharjah Industrial Logistics District',
  'Vendor Direct Showroom Facility',
];

const SPECIALIZATIONS = [
  'Enterprise Servers & Racks',
  'AI & Deep Learning Hardware',
  'High-Performance Workstations',
  'Custom Liquid-Cooled Gaming Rigs',
  'Datacenter Networking & Cyber Infrastructure',
  'OEM Storage & Flash Arrays',
  'Commercial Displays & Audio-Visual',
  'Bulk Hardware Wholesale',
];

const STEPS = [
  { id: 1, label: 'Credentials', icon: Lock },
  { id: 2, label: 'Business KYC', icon: Building2 },
  { id: 3, label: 'Operations', icon: MapPin },
  { id: 4, label: 'Review', icon: CheckCircle2 },
];

export interface ResellerApplicationSuccess {
  applicationId: string;
  businessName: string;
  email: string;
  message: string;
}

interface ResellerApplicationFormProps {
  onSuccess: (result: ResellerApplicationSuccess) => void;
}

export function ResellerApplicationForm({ onSuccess }: ResellerApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — credentials
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — KYC
  const [businessName, setBusinessName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [licenseJurisdiction, setLicenseJurisdiction] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [authorizedSignatory, setAuthorizedSignatory] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');

  // Step 3 — operations / address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dispatchHub, setDispatchHub] = useState('');
  const [settlementTerms, setSettlementTerms] = useState('');

  const toggleSpec = (spec: string) => {
    setSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const validateStep = (current: number): boolean => {
    setError('');
    if (current === 1) {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setError('Enter the primary contact / signatory display name.');
        return false;
      }
      if (!/^[a-z0-9_]{3,30}$/.test(username.trim())) {
        setError('Choose a username of 3–30 letters, numbers, or underscores.');
        return false;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Enter a valid business email address.');
        return false;
      }
      if (!phone.trim() || phone.trim().length < 7 || phone.trim().length > 25) {
        setError('Enter a valid business phone number.');
        return false;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match.');
        return false;
      }
    }
    if (current === 2) {
      if (!businessName.trim() || businessName.trim().length < 3) {
        setError('Legal business / trade name is required.');
        return false;
      }
      if (!tradeLicense.trim()) {
        setError('Trade license number is required.');
        return false;
      }
      if (!taxNumber.trim() || taxNumber.replace(/\s/g, '').length < 10) {
        setError('Enter a valid tax registration number (TRN).');
        return false;
      }
      if (!licenseJurisdiction.trim()) {
        setError('Enter the authority that issued your trade license.');
        return false;
      }
      if (!licenseExpiryDate || licenseExpiryDate < new Date().toISOString().slice(0, 10)) {
        setError('Enter a valid, unexpired trade license date.');
        return false;
      }
      if (!businessType.trim()) {
        setError('Enter your business type.');
        return false;
      }
      if (!authorizedSignatory.trim()) {
        setError('Authorized signatory name is required.');
        return false;
      }
      if (!signatoryTitle.trim()) {
        setError('Enter the authorized signatory’s title.');
        return false;
      }
      if (website.trim()) {
        try {
          const url = new URL(website.trim());
          if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Invalid protocol');
        } catch {
          setError('Enter a valid company website URL beginning with https://.');
          return false;
        }
      }
      if (!description.trim() || description.trim().length < 40) {
        setError('Provide a detailed business description (minimum 40 characters).');
        return false;
      }
      if (specializations.length === 0) {
        setError('Select at least one hardware specialization.');
        return false;
      }
    }
    if (current === 3) {
      if (!addressLine1.trim() || !city.trim() || !stateRegion.trim() || !country.trim()) {
        setError('Complete the registered business address, including city, state or emirate, and country.');
        return false;
      }
      if (!dispatchHub.trim()) {
        setError('Enter your primary dispatch hub or fulfillment location.');
        return false;
      }
      if (!settlementTerms) {
        setError('Select your preferred settlement terms.');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(4, s + 1));
  };

  const goBack = () => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    for (const current of [1, 2, 3]) {
      if (!validateStep(current)) {
        setStep(current);
        return;
      }
    }
    setSubmitting(true);
    setError('');
    try {
      const formattedPhone = formatInternationalPhone(phone, phoneCountry);
      const data = await ApiClient.post<{
        message: string;
        applicationId: string;
        businessName: string;
        email: string;
        status: string;
      }>('/auth/reseller-apply', {
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email.trim().toLowerCase(),
        password,
        phone: formattedPhone,
        businessName: businessName.trim(),
        displayName: displayName.trim(),
        address: {
          fullName: displayName.trim() || businessName.trim(),
          phone: formattedPhone,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: stateRegion.trim(),
          country: country.trim(),
          postalCode: postalCode.trim() || '00000',
        },
        businessInformation: {
          tradeLicense: tradeLicense.trim(),
          licenseJurisdiction: licenseJurisdiction.trim(),
          taxNumber: taxNumber.trim(),
          licenseExpiryDate: licenseExpiryDate || undefined,
          businessType: businessType.trim(),
          specializations,
          authorizedSignatory: authorizedSignatory.trim(),
          signatoryTitle: signatoryTitle.trim(),
          website: website.trim() || undefined,
          description: description.trim(),
          settlementTerms: settlementTerms.trim(),
          dispatchHub: dispatchHub.trim(),
        },
      });

      onSuccess({
        applicationId: data.applicationId,
        businessName: data.businessName,
        email: data.email,
        message: data.message,
      });
    } catch (err: any) {
      setError(err.message || 'Unable to submit reseller application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-tech-slate p-3 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors';
  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-[10px] md:text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : done
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-emerald-400/50' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="p-2.5 md:p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900/50">
          <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>Primary Contact Name *</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Tariq Al-Mansoor" autoComplete="name" />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Portal Username *</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="e.g. apex_admin" autoComplete="username" />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Business Email *</label>
              <div className="relative">
                <input type="email" className={`${inputClass} pl-9`} value={email} onChange={e => setEmail(e.target.value)} placeholder="procurement@company.ae" autoComplete="email" />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Business Phone *</label>
              <PhoneCountryField
                id="reseller-phone"
                label="Business phone"
                value={phone}
                onValueChange={setPhone}
                country={phoneCountry}
                onCountryChange={setPhoneCountry}
                placeholder="4 380 4400"
                accent="amber"
              />
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-9 pr-10`} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-9`} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className={labelClass}>Legal Business Name *</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Apex Hardware Technologies LLC" />
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Trade License No. *</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={tradeLicense} onChange={e => setTradeLicense(e.target.value)} placeholder="TL-DXB-948210" />
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tax Registration (TRN) *</label>
              <input className={inputClass} value={taxNumber} onChange={e => setTaxNumber(e.target.value)} placeholder="15-digit FTA TRN" />
            </div>
            <div>
              <label className={labelClass}>License Jurisdiction *</label>
              <input list="reseller-license-jurisdictions" className={inputClass} value={licenseJurisdiction} onChange={e => setLicenseJurisdiction(e.target.value)} placeholder="Issuing authority or jurisdiction" />
              <datalist id="reseller-license-jurisdictions">{JURISDICTIONS.map(j => <option key={j} value={j} />)}</datalist>
            </div>
            <div>
              <label className={labelClass}>License Expiry *</label>
              <input type="date" min={new Date().toISOString().slice(0, 10)} className={inputClass} value={licenseExpiryDate} onChange={e => setLicenseExpiryDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Business Type *</label>
              <div className="relative">
                <input list="reseller-business-types" className={`${inputClass} pl-9`} value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Select or describe your business type" />
                <datalist id="reseller-business-types">{BUSINESS_TYPES.map(t => <option key={t} value={t} />)}</datalist>
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Company Website</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://company.ae" />
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Authorized Signatory *</label>
              <input className={inputClass} value={authorizedSignatory} onChange={e => setAuthorizedSignatory(e.target.value)} placeholder="Full legal name" />
            </div>
            <div>
              <label className={labelClass}>Signatory Title *</label>
              <input className={inputClass} value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} placeholder="Managing Director" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Hardware Specializations *</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SPECIALIZATIONS.map(spec => {
                  const selected = specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold border transition-all ${
                        selected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {spec}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Business Description * <span className="font-normal text-slate-500">({description.trim().length}/40 min)</span>
              </label>
              <textarea
                rows={4}
                className={`${inputClass} resize-y min-h-[96px]`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your company, markets served, OEM partnerships, fulfillment capacity, and why you want to join the NexTech reseller network..."
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className={labelClass}>Registered Address Line 1 *</label>
              <div className="relative">
                <input className={`${inputClass} pl-9`} value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="Warehouse / Office street address" />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Address Line 2</label>
              <input className={inputClass} value={addressLine2} onChange={e => setAddressLine2(e.target.value)} placeholder="Suite, floor, building (optional)" />
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input className={inputClass} value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Emirate / State *</label>
              <input className={inputClass} value={stateRegion} onChange={e => setStateRegion(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Country *</label>
              <input className={inputClass} value={country} onChange={e => setCountry(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Postal Code</label>
              <input className={inputClass} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00000" />
            </div>
            <div>
              <label className={labelClass}>Primary Dispatch Hub *</label>
              <div className="relative">
                <input list="reseller-dispatch-hubs" className={`${inputClass} pl-9`} value={dispatchHub} onChange={e => setDispatchHub(e.target.value)} placeholder="Warehouse or fulfillment location" />
                <datalist id="reseller-dispatch-hubs">{DISPATCH_HUBS.map(h => <option key={h} value={h} />)}</datalist>
                <Truck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Preferred Settlement Terms *</label>
              <select className={inputClass} value={settlementTerms} onChange={e => setSettlementTerms(e.target.value)}>
                <option value="" disabled>Select settlement terms</option>
                <option>Weekly Automatic Settlement</option>
                <option>Bi-Weekly Settlement</option>
                <option>Net-30 Invoice Settlement</option>
                <option>Net-45 Enterprise Settlement</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Review */}
      {step === 4 && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wide">Application Summary</span>
            </div>
            <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <SummaryItem label="Business" value={businessName} />
              <SummaryItem label="Contact" value={displayName} />
              <SummaryItem label="Email" value={email} />
              <SummaryItem label="Username" value={username} />
              <SummaryItem label="Phone" value={formatInternationalPhone(phone, phoneCountry)} />
              <SummaryItem label="Type" value={businessType} />
              <SummaryItem label="Trade License" value={tradeLicense} />
              <SummaryItem label="TRN" value={taxNumber} />
              <SummaryItem label="Jurisdiction" value={licenseJurisdiction} />
              <SummaryItem label="Signatory" value={`${authorizedSignatory} · ${signatoryTitle}`} />
              <SummaryItem label="Address" value={`${addressLine1}, ${city}, ${country}`} />
              <SummaryItem label="Dispatch Hub" value={dispatchHub} />
              <div className="md:col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Specializations</div>
                <div className="flex flex-wrap gap-1">
                  {specializations.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold">{s}</span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] md:text-[11px] text-slate-500 leading-relaxed">
            By submitting, you confirm all KYC details are accurate. Administration will be notified immediately. Portal login remains locked until your unique reseller ID is assigned and the application is approved.
          </div>
        </div>
      )}

      {/* Nav actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button type="button" onClick={goBack} className="px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : null}
        </div>
        {step < 4 ? (
          <button type="button" onClick={goNext} className="px-5 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] md:text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all">
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] md:text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all disabled:opacity-50">
            {submitting ? 'Submitting Application...' : 'Submit for Admin Approval'}
            {!submitting && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</div>
      <div className="font-semibold text-slate-800 dark:text-slate-200 break-words">{value || '—'}</div>
    </div>
  );
}
