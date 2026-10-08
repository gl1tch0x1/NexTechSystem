'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, RegisterData } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { NextechLogo } from '@/components/ui/NextechLogo';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  Search,
  Phone,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Globe,
  CheckCircle2,
  Store,
  MapPin,
  Sparkles,
  KeyRound,
  RefreshCw,
  Check,
  X,
  Shield,
  Clock,
} from 'lucide-react';

interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
}

/** Render a real country flag SVG image from flagcdn with clean fallback */
function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const lower = code.toLowerCase();
  const height = Math.round(size * 0.7);

  if (hasError) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-[2px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-mono font-bold leading-none shrink-0"
        style={{ width: `${size}px`, height: `${height}px` }}
      >
        {code}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-[2px] overflow-hidden border border-slate-300/60 dark:border-slate-600/60 shrink-0 shadow-xs"
      style={{ width: `${size}px`, height: `${height}px` }}
    >
      <img
        src={`https://flagcdn.com/${lower}.svg`}
        width={size}
        height={height}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </span>
  );
}

const COUNTRY_CODES: CountryCode[] = [
  // Gulf & Middle East
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  // North America
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  // South Asia & East Asia
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
];

const UAE_JURISDICTIONS = [
  'Dubai Economy and Tourism (DET)',
  'Abu Dhabi Department of Economic Development (ADDED)',
  'Sharjah Economic Development Department (SEDD)',
  'Dubai Silicon Oasis (DSO)',
  'Dubai Multi Commodities Centre (DMCC)',
  'Jebel Ali Free Zone Authority (JAFZA)',
  'Dubai Integrated Economic Zones (DIEZ)',
  'Abu Dhabi Global Market (ADGM)',
  'Dubai International Financial Centre (DIFC)',
  'Ras Al Khaimah Economic Zone (RAKEZ)',
  'Sharjah Media City (Shams)',
  'Other UAE Commercial Licensing Authority',
];

const BUSINESS_CATEGORIES = [
  'IT Solutions & Hardware Distributor',
  'Value-Added Reseller (VAR)',
  'System Integrator & Enterprise Infrastructure',
  'Managed Service Provider (MSP)',
  'Corporate Enterprise Procurement',
  'Computer & Peripherals Retail Network',
  'Cloud & Data Center Architecture Partner',
];

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

const SETTLEMENT_TERMS_OPTIONS = [
  'Net 30 Days (Standard Enterprise Credit)',
  'Net 15 Days (Accelerated Billing)',
  'Immediate Settlement / Prepaid Corporate Wire',
  'Letter of Credit (LC) / Escrow',
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';

  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'RESELLER'>('CUSTOMER');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'new-password' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Timer countdown for OTP resend cooldown
  useEffect(() => {
    let timer: any;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown(c => Math.max(0, c - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [forgotCooldown]);

  const handleOpenForgotPassword = () => {
    setShowForgotModal(true);
    setForgotStep('request');
    setForgotEmail(loginEmail ? loginEmail.trim() : '');
    setForgotOtp('');
    setForgotResetToken('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotDevCode(null);
  };

  const handleRequestResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = forgotEmail.trim();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await ApiClient.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: clean }),
      });
      if (res.success) {
        setForgotMaskedEmail(res.data?.maskedEmail || clean);
        setForgotCooldown(res.data?.resendCooldownSeconds || 60);
        if (res.data?.devCode) {
          setForgotDevCode(res.data.devCode);
          setForgotOtp(res.data.devCode);
        }
        setForgotStep('verify');
        setForgotSuccess(res.data?.message || 'Verification code sent to your email.');
      } else {
        setForgotError(res.error?.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Unable to request password reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await ApiClient.request('/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim(), code: cleanOtp }),
      });
      if (res.success && res.data?.resetToken) {
        setForgotResetToken(res.data.resetToken);
        setForgotStep('new-password');
        setForgotSuccess('Code verified successfully! Please enter your new password.');
      } else {
        setForgotError(res.error?.message || 'Invalid verification code.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSetNewPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword.length > 128) {
      setForgotError('Password must not exceed 128 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await ApiClient.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken: forgotResetToken,
          newPassword: forgotNewPassword,
        }),
      });
      if (res.success) {
        setForgotStep('success');
        setLoginEmail(forgotEmail.trim());
        setLoginPassword('');
      } else {
        setForgotError(res.error?.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Password update failed. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Customer Register state ("they just have to create the account - nothing else")
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // Enterprise Reseller Register state (full professional details)
  const [resellerBusinessName, setResellerBusinessName] = useState('');
  const [resellerTradeLicense, setResellerTradeLicense] = useState('');
  const [resellerTaxNumber, setResellerTaxNumber] = useState('');
  const [resellerJurisdiction, setResellerJurisdiction] = useState(UAE_JURISDICTIONS[0]);
  const [resellerBusinessType, setResellerBusinessType] = useState(BUSINESS_CATEGORIES[0]);
  const [resellerSignatoryName, setResellerSignatoryName] = useState('');
  const [resellerSignatoryTitle, setResellerSignatoryTitle] = useState('Managing Director');
  const [resellerEmail, setResellerEmail] = useState('');
  const [resellerPhone, setResellerPhone] = useState('');
  const [resellerCode, setResellerCode] = useState('');
  const [resellerWebsite, setResellerWebsite] = useState('');
  const [resellerCity, setResellerCity] = useState(UAE_EMIRATES[0]);
  const [resellerAddressStreet, setResellerAddressStreet] = useState('');
  const [resellerSettlementTerms, setResellerSettlementTerms] = useState(SETTLEMENT_TERMS_OPTIONS[0]);
  const [resellerPassword, setResellerPassword] = useState('');
  const [resellerConfirmPassword, setResellerConfirmPassword] = useState('');
  const [showResellerPassword, setShowResellerPassword] = useState(false);
  const [resellerComplianceAccepted, setResellerComplianceAccepted] = useState(false);

  // Phone dropdown state for Customer
  const [custCountry, setCustCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [isCustCountryOpen, setIsCustCountryOpen] = useState(false);
  const [custCountrySearch, setCustCountrySearch] = useState('');
  const custCountryRef = useRef<HTMLDivElement>(null);

  // Phone dropdown state for Reseller
  const [resellerCountry, setResellerCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [isResellerCountryOpen, setIsResellerCountryOpen] = useState(false);
  const [resellerCountrySearch, setResellerCountrySearch] = useState('');
  const resellerCountryRef = useRef<HTMLDivElement>(null);

  // Auto-generate reseller handle slug as business name is typed
  useEffect(() => {
    if (resellerBusinessName && !resellerCode) {
      const slug = resellerBusinessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      setResellerCode(slug);
    }
  }, [resellerBusinessName]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (custCountryRef.current && !custCountryRef.current.contains(event.target as Node)) {
        setIsCustCountryOpen(false);
      }
      if (resellerCountryRef.current && !resellerCountryRef.current.contains(event.target as Node)) {
        setIsResellerCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(custCountrySearch.toLowerCase()) ||
    c.dialCode.includes(custCountrySearch) ||
    c.code.toLowerCase().includes(custCountrySearch.toLowerCase())
  );

  const filteredResellerCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(resellerCountrySearch.toLowerCase()) ||
    c.dialCode.includes(resellerCountrySearch) ||
    c.code.toLowerCase().includes(resellerCountrySearch.toLowerCase())
  );

  const handleRoleRedirect = (authenticatedUser: any, resellerData: any) => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      router.push(redirectParam);
      return;
    }
    if (authenticatedUser.role === 'ADMIN') {
      router.push('/admin');
    } else if (authenticatedUser.role === 'RESELLER' && (resellerData?.resellerCode || authenticatedUser.resellerId)) {
      router.push(`/reseller/${resellerData?.resellerCode || authenticatedUser.username}/dashboard`);
    } else {
      router.push('/account');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { user: authedUser, reseller: resData } = await login(loginEmail.trim(), loginPassword);
      handleRoleRedirect(authedUser, resData);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  // 1. Customer registration handler (instant, zero friction)
  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!custName.trim() || !custEmail.trim() || !custPassword) {
      setError('Please provide your name, email, and password.');
      return;
    }

    try {
      const cleanPhone = custPhone.trim();
      let formattedPhone = '';
      if (cleanPhone) {
        if (cleanPhone.startsWith('+')) {
          formattedPhone = cleanPhone;
        } else {
          formattedPhone = `${custCountry.dialCode} ${cleanPhone.replace(/^0+/, '')}`;
        }
      }

      const { user: newUser, reseller: resDoc } = await register({
        accountType: 'CUSTOMER',
        name: custName.trim(),
        email: custEmail.trim(),
        phone: formattedPhone,
        password: custPassword,
      });

      handleRoleRedirect(newUser, resDoc);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    }
  };

  // 2. Enterprise Reseller registration handler (comprehensive B2B information)
  const handleResellerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resellerBusinessName.trim()) {
      setError('Corporate Legal Business Name is required.');
      return;
    }
    if (!resellerTradeLicense.trim()) {
      setError('Commercial Trade License number is required.');
      return;
    }
    if (!resellerTaxNumber.trim()) {
      setError('Federal Tax Authority TRN (15 digits) is required for verified resellers.');
      return;
    }
    if (!resellerSignatoryName.trim()) {
      setError('Authorized Signatory name is required.');
      return;
    }
    if (!resellerEmail.trim()) {
      setError('Official corporate business email is required.');
      return;
    }
    if (resellerPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (resellerPassword !== resellerConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!resellerComplianceAccepted) {
      setError('You must accept the commercial licensing & FTA compliance declaration.');
      return;
    }

    try {
      const cleanPhone = resellerPhone.trim();
      let formattedPhone = '';
      if (cleanPhone) {
        if (cleanPhone.startsWith('+')) {
          formattedPhone = cleanPhone;
        } else {
          formattedPhone = `${resellerCountry.dialCode} ${cleanPhone.replace(/^0+/, '')}`;
        }
      }

      const cleanCode = (resellerCode || resellerBusinessName)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 25);

      const payload: RegisterData = {
        accountType: 'RESELLER',
        name: resellerSignatoryName.trim(),
        email: resellerEmail.trim(),
        phone: formattedPhone,
        password: resellerPassword,
        businessName: resellerBusinessName.trim(),
        tradeLicense: resellerTradeLicense.trim(),
        taxNumber: resellerTaxNumber.trim(),
        taxRegistrationNumber: resellerTaxNumber.trim(),
        licenseJurisdiction: resellerJurisdiction,
        businessType: resellerBusinessType,
        signatoryTitle: resellerSignatoryTitle.trim() || 'Managing Director',
        website: resellerWebsite.trim(),
        resellerCode: cleanCode,
        addressStreet: resellerAddressStreet.trim() || 'Commercial Business Center',
        addressCity: resellerCity,
        settlementTerms: resellerSettlementTerms,
      };

      const { user: newUser, reseller: resDoc } = await register(payload);
      handleRoleRedirect(newUser, resDoc);
    } catch (err: any) {
      setError(err.message || 'Reseller registration failed. Please review your commercial information.');
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { user: authedUser, reseller: resData } = await loginWithGoogle();
      handleRoleRedirect(authedUser, resData);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google authentication was cancelled or encountered an error.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className={`mx-auto px-4 py-8 md:py-12 space-y-6 w-full transition-all duration-300 ${
        tab === 'register' && accountType === 'RESELLER' ? 'max-w-3xl' : 'max-w-md md:max-w-2xl'
      }`}
    >
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-lg shadow-blue-500/15 mx-auto p-1.5 flex items-center justify-center">
          <NextechLogo size={48} className="w-full h-full" alt="NexTech Systems Logo" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          NexTech Systems Portal
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Unified authentication for Enterprise Clients, Verified Resellers &amp; Administrators
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="p-4 md:p-6 rounded-3xl bg-white dark:bg-tech-card border border-slate-200 dark:border-tech-slate space-y-5 shadow-tech">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-[11px] md:text-xs font-bold transition-all ${
              tab === 'signin'
                ? 'bg-tech-blue text-white shadow-tech'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-[11px] md:text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-tech-blue text-white shadow-tech'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 md:p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] md:text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button (shown for Sign In and for Customer Registration) */}
        {(tab === 'signin' || (tab === 'register' && accountType === 'CUSTOMER')) && (
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || isLoading}
              className="w-full py-2.5 md:py-3 px-3 md:px-4 bg-slate-50 dark:bg-tech-slate hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-[11px] md:text-xs font-bold flex items-center justify-center gap-2 md:gap-3 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : tab === 'signin'
                  ? 'Continue with Google'
                  : 'Sign up with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              <span className="bg-white dark:bg-tech-card px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative">
                Or with Email
              </span>
            </div>
          </>
        )}

        {/* 1. SIGN IN TAB */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] md:text-xs font-bold text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[10px] md:text-[11px] text-tech-cyan hover:text-cyan-300 font-bold transition-colors hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 pr-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 md:py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-[11px] md:text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Logins for Testing & Evaluation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Demo Fast Fill
                </span>
                <span className="text-[10px] text-slate-500 font-mono">password@123</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('client@nextech.com');
                    setLoginPassword('password@123');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-slate-700 text-tech-blue dark:text-cyan-300 text-[10px] font-bold border border-blue-200 dark:border-slate-700 transition-colors text-center truncate"
                  title="Fill Customer Demo (client@nextech.com)"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@nextech.com');
                    setLoginPassword('password@123');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-lg bg-purple-50 dark:bg-slate-800/80 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-slate-700 transition-colors text-center truncate"
                  title="Fill Admin Demo (admin@nextech.com)"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('partner@comnet.ae');
                    setLoginPassword('password@123');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-slate-700 transition-colors text-center truncate"
                  title="Fill Reseller Demo (partner@comnet.ae)"
                >
                  Reseller
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. CREATE ACCOUNT TAB */}
        {tab === 'register' && (
          <div className="space-y-5">
            {/* Account Type Selector: Customer vs Enterprise Reseller */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Select Account Role
                </label>
                <span className="text-[10px] font-bold text-tech-blue dark:text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {accountType === 'CUSTOMER' ? 'Instant Self-Registration' : 'Verified B2B Wholesale'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Customer Option Card */}
                <button
                  type="button"
                  onClick={() => { setAccountType('CUSTOMER'); setError(''); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group ${
                    accountType === 'CUSTOMER'
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-tech-blue dark:border-blue-500 shadow-sm ring-1 ring-tech-blue/30'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          accountType === 'CUSTOMER'
                            ? 'bg-tech-blue text-white shadow-tech'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Customer Account</div>
                        <div className="text-[10px] text-slate-500">Personal &amp; Direct Buyer</div>
                      </div>
                    </div>
                    {accountType === 'CUSTOMER' && (
                      <CheckCircle2 className="w-4 h-4 text-tech-blue shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zero-friction instant signup. Just your name, email, and password to start shopping.
                  </p>
                </button>

                {/* 2. Reseller Option Card */}
                <button
                  type="button"
                  onClick={() => { setAccountType('RESELLER'); setError(''); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group ${
                    accountType === 'RESELLER'
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-tech-blue dark:border-blue-500 shadow-sm ring-1 ring-tech-blue/30'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          accountType === 'RESELLER'
                            ? 'bg-tech-blue text-white shadow-tech'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Enterprise Reseller</span>
                          <span className="text-[8px] uppercase tracking-wide bg-blue-100 dark:bg-blue-900/60 text-tech-blue dark:text-blue-300 font-extrabold px-1.5 py-0.5 rounded-full">
                            B2B Partner
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">Corporate Reseller Network</div>
                      </div>
                    </div>
                    {accountType === 'RESELLER' && (
                      <CheckCircle2 className="w-4 h-4 text-tech-blue shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Wholesale margins, credit facility, dedicated storefront, and verified commercial terms.
                  </p>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-FORM A: CUSTOMER ACCOUNT CREATION (FAST & ZERO FRICTION)            */}
            {/* "if the account is created by the customer they just have to create the   */}
            {/* account - nothing else."                                                  */}
            {/* ========================================================================= */}
            {accountType === 'CUSTOMER' && (
              <form onSubmit={handleCustomerRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="e.g. Jordan Smith"
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                      />
                      <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="jordan@example.com"
                        value={custEmail}
                        onChange={e => setCustEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                      />
                      <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                      Phone Number <span className="font-normal text-slate-500">(Optional)</span>
                    </label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-tech-slate focus-within:border-tech-blue transition-colors">
                      {/* Country Selector Trigger */}
                      <div ref={custCountryRef} className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustCountryOpen(prev => !prev);
                            setCustCountrySearch('');
                          }}
                          className="h-full flex items-center gap-1.5 pl-2.5 md:pl-3 pr-2 py-2.5 md:py-3 rounded-l-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                          title={`${custCountry.name} (${custCountry.dialCode})`}
                          aria-label="Select country code"
                        >
                          <CountryFlag code={custCountry.code} size={20} />
                          <span className="font-mono text-slate-800 dark:text-slate-100 text-[11px] md:text-xs font-bold">
                            {custCountry.dialCode}
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform ${
                              isCustCountryOpen ? 'rotate-180 text-tech-blue' : ''
                            }`}
                          />
                        </button>

                        {/* Country Dropdown Popover */}
                        {isCustCountryOpen && (
                          <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-2xl z-[200] flex flex-col overflow-hidden">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search country or code..."
                                  value={custCountrySearch}
                                  onChange={e => setCustCountrySearch(e.target.value)}
                                  className="w-full bg-slate-100 dark:bg-slate-800 pl-8 pr-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue placeholder:text-slate-400"
                                  autoFocus
                                />
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              </div>
                            </div>
                            <div className="overflow-y-auto p-1.5 space-y-0.5" style={{ maxHeight: '200px' }}>
                              {filteredCustCountries.map(c => {
                                const isSelected = custCountry.code === c.code;
                                return (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setCustCountry(c);
                                      setIsCustCountryOpen(false);
                                      setCustCountrySearch('');
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                                      isSelected
                                        ? 'bg-tech-blue text-white font-bold'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                    }`}
                                  >
                                    <CountryFlag code={c.code} size={20} />
                                    <span className="flex-1 truncate text-[11px]">{c.name}</span>
                                    <span className="font-mono text-[11px] shrink-0 text-slate-400">
                                      {c.dialCode}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <input
                        type="tel"
                        autoComplete="tel"
                        placeholder="50 123 4567"
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2.5 md:py-3 text-[11px] md:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
                      />
                      <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0 mr-3" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                      Password (min 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showCustPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={custPassword}
                        onChange={e => setCustPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 pr-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                      />
                      <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(prev => !prev)}
                        className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        aria-label={showCustPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCustPassword ? (
                          <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 md:py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-[11px] md:text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Creating Customer Account...</span>
                  ) : (
                    <>
                      <span>Create Customer Account</span>
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* SUB-FORM B: ENTERPRISE RESELLER ACCOUNT CREATION                         */}
            {/* "while reseller has to create the account they have to provide the        */}
            {/* complete details for registering themself like professional reseller      */}
            {/* information."                                                             */}
            {/* ========================================================================= */}
            {accountType === 'RESELLER' && (
              <form onSubmit={handleResellerRegisterSubmit} className="space-y-6">
                {/* Onboarding Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-left">
                  <div className="w-7 h-7 rounded-xl bg-tech-blue/10 dark:bg-tech-blue/20 text-tech-blue flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      B2B Wholesale Partner Certification
                    </div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">
                      Resellers receive wholesale tier discounts, Net 30 trade credit, and a custom branded storefront. Official Trade License and FTA TRN are required for commercial verification.
                    </p>
                  </div>
                </div>

                {/* Section 1: Commercial & Legal Entity Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="w-4 h-4 text-tech-blue shrink-0" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      1. Corporate &amp; Legal Entity Information
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Legal Company Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Legal Business / Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Al-Futtaim Technologies LLC"
                        value={resellerBusinessName}
                        onChange={e => setResellerBusinessName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>

                    {/* Trade License Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Commercial Trade License No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CN-1049283 / DED-89302"
                        value={resellerTradeLicense}
                        onChange={e => setResellerTradeLicense(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue font-mono"
                      />
                    </div>

                    {/* Federal Tax Authority TRN */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Federal Tax Authority TRN (15 Digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={15}
                        placeholder="e.g. 100293847500003"
                        value={resellerTaxNumber}
                        onChange={e => setResellerTaxNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue font-mono"
                      />
                    </div>

                    {/* Licensing Jurisdiction */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Commercial Licensing Jurisdiction <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resellerJurisdiction}
                        onChange={e => setResellerJurisdiction(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      >
                        {UAE_JURISDICTIONS.map(j => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </div>

                    {/* Business Category */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Business Model &amp; Core Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resellerBusinessType}
                        onChange={e => setResellerBusinessType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      >
                        {BUSINESS_CATEGORIES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Authorized Signatory & Executive Contact */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      2. Authorized Signatory &amp; Executive Contact
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Authorized Signatory Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Authorized Signatory Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tariq Al-Mansoor"
                        value={resellerSignatoryName}
                        onChange={e => setResellerSignatoryName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>

                    {/* Signatory Designation */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Signatory Designation / Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Managing Director / Procurement Head"
                        value={resellerSignatoryTitle}
                        onChange={e => setResellerSignatoryTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>

                    {/* Official Corporate Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Corporate Business Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="procurement@company.com"
                        value={resellerEmail}
                        onChange={e => setResellerEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>

                    {/* Corporate Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Corporate Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-tech-slate focus-within:border-tech-blue transition-colors">
                        <div ref={resellerCountryRef} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsResellerCountryOpen(prev => !prev);
                              setResellerCountrySearch('');
                            }}
                            className="h-full flex items-center gap-1.5 pl-2.5 pr-2 py-2.5 rounded-l-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                            title={`${resellerCountry.name} (${resellerCountry.dialCode})`}
                          >
                            <CountryFlag code={resellerCountry.code} size={20} />
                            <span className="font-mono text-slate-800 dark:text-slate-100 text-xs font-bold">
                              {resellerCountry.dialCode}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          {isResellerCountryOpen && (
                            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-2xl z-[200] flex flex-col overflow-hidden">
                              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                <input
                                  type="text"
                                  placeholder="Search country or code..."
                                  value={resellerCountrySearch}
                                  onChange={e => setResellerCountrySearch(e.target.value)}
                                  className="w-full bg-slate-100 dark:bg-slate-800 pl-3 pr-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                                  autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto p-1.5 space-y-0.5" style={{ maxHeight: '180px' }}>
                                {filteredResellerCountries.map(c => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setResellerCountry(c);
                                      setIsResellerCountryOpen(false);
                                      setResellerCountrySearch('');
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    <CountryFlag code={c.code} size={18} />
                                    <span className="flex-1 truncate text-[11px]">{c.name}</span>
                                    <span className="font-mono text-[11px] text-slate-400">{c.dialCode}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <input
                          type="tel"
                          required
                          placeholder="50 987 6543"
                          value={resellerPhone}
                          onChange={e => setResellerPhone(e.target.value)}
                          className="flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Storefront & Operational Logistics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Store className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      3. Storefront Handle &amp; Commercial Terms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Storefront Subdomain Handle */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Portal Storefront Code / Subdomain <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. alfuttaim"
                          value={resellerCode}
                          onChange={e => setResellerCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 pl-8 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue font-mono"
                        />
                        <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500 font-mono">
                        URL: nextechsystem.com/reseller/{resellerCode || 'your-code'}
                      </div>
                    </div>

                    {/* Official Website */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Company Website <span className="font-normal text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://company.ae"
                        value={resellerWebsite}
                        onChange={e => setResellerWebsite(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>

                    {/* Operating Emirate */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Headquarters / Primary Emirate <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resellerCity}
                        onChange={e => setResellerCity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      >
                        {UAE_EMIRATES.map(em => (
                          <option key={em} value={em}>{em}, UAE</option>
                        ))}
                      </select>
                    </div>

                    {/* Settlement Terms */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Requested Commercial Settlement Terms <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resellerSettlementTerms}
                        onChange={e => setResellerSettlementTerms(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      >
                        {SETTLEMENT_TERMS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Physical Office Address */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Office / Warehouse Physical Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Office 1204, Tower B, Business Bay, Dubai"
                          value={resellerAddressStreet}
                          onChange={e => setResellerAddressStreet(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 pl-8 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                        />
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Security & Compliance Certification */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      4. Portal Security &amp; Compliance Certification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Corporate Portal Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showResellerPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          placeholder="Min 8 characters"
                          value={resellerPassword}
                          onChange={e => setResellerPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 pl-8 pr-9 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowResellerPassword(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showResellerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Confirm Corporate Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={showResellerPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={resellerConfirmPassword}
                        onChange={e => setResellerConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                      />
                    </div>
                  </div>

                  {/* Certification Checkbox */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={resellerComplianceAccepted}
                        onChange={e => setResellerComplianceAccepted(e.target.checked)}
                        className="mt-1 rounded text-tech-blue focus:ring-tech-blue dark:bg-slate-800 dark:border-slate-700"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        I hereby certify that all commercial details, Commercial Trade License, and FTA TRN provided are authentic and in compliance with UAE Federal Commercial Laws and Tax Authority regulations. I authorize NexTech Systems to verify all registered enterprise partner credentials.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Reseller Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Registering Enterprise Reseller...</span>
                  ) : (
                    <>
                      <span>Register Enterprise Reseller Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL FORGOT PASSWORD MODAL (EMAIL OTP VERIFICATION & RESET)      */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !forgotLoading) {
              setShowForgotModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Ambient Top Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

            {/* Header & Close Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  {forgotStep === 'request' && <KeyRound className="w-5 h-5" />}
                  {forgotStep === 'verify' && <Clock className="w-5 h-5 animate-pulse" />}
                  {forgotStep === 'new-password' && <Lock className="w-5 h-5" />}
                  {forgotStep === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
                <div>
                  <h3 id="forgot-password-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {forgotStep === 'request' && 'Reset Your Password'}
                    {forgotStep === 'verify' && 'Verify Security Code'}
                    {forgotStep === 'new-password' && 'Create New Password'}
                    {forgotStep === 'success' && 'Password Updated!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {forgotStep === 'request' && 'Enter your registered email to receive a 6-digit OTP.'}
                    {forgotStep === 'verify' && 'Enter the verification code sent to your inbox.'}
                    {forgotStep === 'new-password' && 'Set a strong, secure password for your account.'}
                    {forgotStep === 'success' && 'Your account security credentials are renewed.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                disabled={forgotLoading}
                aria-label="Close forgot password dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Stepper */}
            {forgotStep !== 'success' && (
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                {[
                  { step: 'request', label: '1. Email' },
                  { step: 'verify', label: '2. Verify OTP' },
                  { step: 'new-password', label: '3. New Password' },
                ].map((s, idx) => {
                  const isActive = forgotStep === s.step;
                  const isDone =
                    (s.step === 'request' && (forgotStep === 'verify' || forgotStep === 'new-password')) ||
                    (s.step === 'verify' && forgotStep === 'new-password');
                  return (
                    <div key={s.step} className="flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                      </span>
                      <span className={isActive ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-emerald-500' : 'text-slate-400'}>
                        {s.label.split('. ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error Message Alert */}
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{forgotError}</span>
              </div>
            )}

            {/* Success Toast / Notification */}
            {forgotSuccess && forgotStep !== 'success' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="flex-1">{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {forgotStep === 'request' && (
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    We'll dispatch a single-use 6-digit numeric verification code to this address.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>Security code sent to</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {forgotMaskedEmail || forgotEmail}
                  </div>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70">
                    The code is valid for 10 minutes. Check your inbox and spam folder.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">6-Digit Verification Code</label>
                    <span className="text-[11px] text-slate-400">Server-side authenticated</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={forgotLoading}
                    autoFocus
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                {forgotDevCode && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-mono flex items-center justify-between">
                    <span>Dev Environment Code:</span>
                    <span className="font-bold tracking-widest">{forgotDevCode}</span>
                  </div>
                )}

                {/* Resend Cooldown Section */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Change email
                  </button>
                  {forgotCooldown > 0 ? (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend in {forgotCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestResetOtp()}
                      disabled={forgotLoading}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.trim().length !== 6}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {forgotStep === 'new-password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Minimum 8 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      disabled={forgotLoading}
                      autoFocus
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      tabIndex={-1}
                      aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Re-enter your new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      disabled={forgotLoading}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      tabIndex={-1}
                      aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicators */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div
                    className={`flex items-center gap-1.5 ${
                      forgotNewPassword.length >= 8 ? 'text-emerald-500 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {forgotNewPassword.length >= 8 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-400" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      forgotNewPassword && forgotConfirmPassword && forgotNewPassword === forgotConfirmPassword
                        ? 'text-emerald-500 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {forgotNewPassword && forgotConfirmPassword && forgotNewPassword === forgotConfirmPassword ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-400" />
                    )}
                    <span>Passwords match</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      forgotLoading ||
                      forgotNewPassword.length < 8 ||
                      forgotNewPassword !== forgotConfirmPassword
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Set New Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {forgotStep === 'success' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Password Successfully Reset!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Your password has been securely updated and PBKDF2 re-hashed. You can now sign in with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setTab('signin');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Policy Notice Card */}
      <div className="p-3.5 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-[11px] md:text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
          <span>Role Policy Notice</span>
        </div>
        <p className="text-[10px] md:text-[11px] text-slate-500">
          Customer accounts grant instant access to client cart, order tracking, and express delivery. Reseller partner accounts provision dedicated B2B wholesale pricing, Net 30 corporate trade credit, and custom subdomain storefronts.
        </p>
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
