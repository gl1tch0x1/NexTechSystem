'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Cpu, Lock, Mail, User as UserIcon, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, Eye, EyeOff, CheckCircle2, ShoppingBag, Building2 } from 'lucide-react';
import { ResellerApplicationForm, ResellerApplicationSuccess } from '@/components/auth/ResellerApplicationForm';
import { PhoneCountryField, COUNTRY_CODES, formatInternationalPhone, type CountryCode } from '@/components/auth/PhoneCountryField';


function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';

  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [accountType, setAccountType] = useState<'customer' | 'reseller' | null>(null);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resellerSuccess, setResellerSuccess] = useState<ResellerApplicationSuccess | null>(null);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);

  const handleRoleRedirect = (authenticatedUser: any, resellerData: any) => {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const formattedPhone = regPhone.trim() ? formatInternationalPhone(regPhone, selectedCountry) : '';
      await register(regName.trim(), regEmail.trim(), regUsername.trim(), formattedPhone, regPassword);
      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { user: authedUser, reseller: resData } = await loginWithGoogle();
      if (tab === 'register' && accountType === 'customer' && authedUser.role === 'CUSTOMER') {
        router.push('/products');
      } else {
        handleRoleRedirect(authedUser, resData);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google authentication was cancelled or encountered an error.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`mx-auto px-4 py-8 md:py-12 space-y-6 w-full ${tab === 'register' && accountType === 'reseller' ? 'max-w-md md:max-w-3xl' : 'max-w-md md:max-w-2xl'}`}>
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-tech-blue flex items-center justify-center text-white mx-auto shadow-tech-glow">
          <Cpu className="w-7 h-7" />
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
            onClick={() => { setTab('signin'); setAccountType(null); setError(''); setResellerSuccess(null); }}
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
            onClick={() => { setTab('register'); setAccountType(null); setError(''); setResellerSuccess(null); }}
            className={`py-2.5 px-3 rounded-xl text-[11px] md:text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-tech-blue text-white shadow-tech'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Choose an account type before either registration form is shown. */}
        {tab === 'register' && !accountType && !resellerSuccess && (
          <section className="space-y-4" aria-labelledby="account-type-heading">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tech-blue dark:text-tech-cyan">Step 1 of 2</p>
              <h2 id="account-type-heading" className="text-lg md:text-xl font-black text-slate-900 dark:text-white">How will you use NexTech?</h2>
              <p className="text-xs text-slate-500">Choose your account type to see the right registration form.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => { setAccountType('customer'); setError(''); }} className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-4 md:p-5 text-left transition-all hover:border-tech-blue hover:bg-blue-50/60 dark:hover:bg-blue-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-tech-blue dark:text-blue-300"><ShoppingBag className="h-5 w-5" /></span>
                <span className="space-y-1"><span className="block text-sm font-black text-slate-900 dark:text-white">I’m a Customer</span><span className="block text-xs leading-relaxed text-slate-600 dark:text-slate-400">Shop products, build a PC, compare hardware, and manage orders.</span></span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-tech-blue dark:text-tech-cyan">Create a shopping account <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </button>
              <button type="button" onClick={() => { setAccountType('reseller'); setError(''); }} className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-4 md:p-5 text-left transition-all hover:border-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"><Building2 className="h-5 w-5" /></span>
                <span className="space-y-1"><span className="block text-sm font-black text-slate-900 dark:text-white">I’m a Reseller</span><span className="block text-xs leading-relaxed text-slate-600 dark:text-slate-400">Apply with complete business and operating details for admin review.</span></span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">Start partner application <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </button>
            </div>
            <p className="rounded-xl bg-slate-100 dark:bg-slate-900 px-3 py-2.5 text-center text-[11px] text-slate-600 dark:text-slate-400">Customer access starts after registration. Reseller access starts only after approval and ID assignment.</p>
          </section>
        )}

        {tab === 'register' && accountType && !resellerSuccess && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <button type="button" onClick={() => { setAccountType(null); setError(''); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-tech-cyan"><ArrowLeft className="h-4 w-4" /> Change account type</button>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{accountType === 'customer' ? 'Customer registration' : 'Reseller application'}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 md:p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] md:text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reseller application success */}
        {tab === 'register' && resellerSuccess && (
          <div className="space-y-4 animate-fadeIn text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/25">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">Application Submitted</h2>
              <p className="text-[11px] md:text-xs text-slate-500 mt-1.5 leading-relaxed max-w-md mx-auto">
                {resellerSuccess.message}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 text-left text-[11px] space-y-2 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold">Business</span><span className="font-semibold text-slate-800 dark:text-slate-200">{resellerSuccess.businessName}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold">Email</span><span className="font-semibold text-slate-800 dark:text-slate-200">{resellerSuccess.email}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-400 font-bold">Status</span><span className="font-bold text-amber-600 dark:text-amber-400">PENDING APPROVAL</span></div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              NexTech Administration has been notified. After approval you will receive your unique reseller ID and can sign in to the partner portal.
            </p>
            <button
              type="button"
              onClick={() => { setTab('signin'); setResellerSuccess(null); setAccountType(null); }}
              className="w-full py-3 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-[11px] md:text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all"
            >
              Return to Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Google — sign-in or customer register only */}
        {(tab === 'signin' || (tab === 'register' && accountType === 'customer' && !resellerSuccess)) && (
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
                {googleLoading ? 'Connecting to Google...' : tab === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
              </span>
            </button>

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
                <span className="text-[10px] md:text-[11px] text-tech-cyan">Secure 256-Bit SSL</span>
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
          </form>
        )}

        {/* 2a. CREATE CUSTOMER ACCOUNT */}
        {tab === 'register' && accountType === 'customer' && !resellerSuccess && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                  />
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                  />
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  Username <span className="font-normal text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Choose a username"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                  />
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  Phone Number <span className="font-normal text-slate-500">(Optional)</span>
                </label>

                <PhoneCountryField
                  id="customer-phone"
                  label="Phone number"
                  value={regPhone}
                  onValueChange={setRegPhone}
                  country={selectedCountry}
                  onCountryChange={setSelectedCountry}
                />
              </div>
            </div>

            {/* Password field (full width) */}
            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-2.5 md:p-3 pl-8 md:pl-10 pr-10 rounded-xl text-[11px] md:text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue transition-colors"
                />
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(prev => !prev)}
                  className="absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? (
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

        {/* 2b. RESELLER PARTNER APPLICATION */}
        {tab === 'register' && accountType === 'reseller' && !resellerSuccess && (
          <ResellerApplicationForm
            onSuccess={(result) => setResellerSuccess(result)}
          />
        )}
      </div>

      {/* Role Notice Card */}
      <div className="p-3 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-[11px] md:text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
          <span>Account &amp; Partner Policy</span>
        </div>
        <p className="text-[10px] md:text-[11px] text-slate-500">
          Customer accounts activate immediately. Reseller partner applications require full KYC review — NexTech Administration assigns your unique reseller ID upon approval.
        </p>
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-blue"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
