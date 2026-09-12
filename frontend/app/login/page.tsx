'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Cpu, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, ShieldCheck, ChevronDown, Search, Phone, Eye, EyeOff } from 'lucide-react';

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
  { code: 'SY', name: 'Syria', dialCode: '+963' },
  { code: 'YE', name: 'Yemen', dialCode: '+967' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  // North America
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  // South Asia
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  // East & Southeast Asia
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  // Africa
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  // South America
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';

  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dialCode.includes(countrySearch) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

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
      const cleanPhone = regPhone.trim();
      let formattedPhone = '';
      if (cleanPhone) {
        if (cleanPhone.startsWith('+')) {
          formattedPhone = cleanPhone;
        } else {
          formattedPhone = `${selectedCountry.dialCode} ${cleanPhone.replace(/^0+/, '')}`;
        }
      }
      const newUser = await register(regName.trim(), regEmail.trim(), regUsername.trim(), formattedPhone, regPassword);
      handleRoleRedirect(newUser, null);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
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
    <div className="max-w-md md:max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6 w-full">
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

        {/* Google Sign-In Button */}
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

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          <span className="bg-white dark:bg-tech-card px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative">
            Or with Email
          </span>
        </div>

        {/* 1. SIGN IN TAB */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
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

        {/* 2. CREATE CUSTOMER ACCOUNT TAB */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  Full Name / Organization
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

              {/* Business Email */}
              <div>
                <label className="block text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  Business Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
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

                {/* Unified Flag + Dial Code + Input Row */}
                <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-tech-slate focus-within:border-tech-blue transition-colors">
                  {/* Country Selector Trigger */}
                  <div ref={countryDropdownRef} className="relative shrink-0">
                    <button
                      type="button"
                      id="phone-country-selector"
                      onClick={() => {
                        setIsCountryDropdownOpen(prev => !prev);
                        setCountrySearch('');
                      }}
                      className="h-full flex items-center gap-1.5 pl-2.5 md:pl-3 pr-2 py-2.5 md:py-3 rounded-l-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                      title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
                      aria-label="Select country code"
                    >
                      {/* Flag together with dial code */}
                      <CountryFlag code={selectedCountry.code} size={20} />
                      <span className="font-mono text-slate-800 dark:text-slate-100 text-[11px] md:text-xs font-bold">
                        {selectedCountry.dialCode}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform ${
                          isCountryDropdownOpen ? 'rotate-180 text-tech-blue' : ''
                        }`}
                      />
                    </button>

                    {/* Country Dropdown Popover */}
                    {isCountryDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 shadow-2xl z-[200] flex flex-col overflow-hidden">
                        {/* Search bar */}
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search country or code..."
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-800 pl-8 pr-3 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue placeholder:text-slate-400"
                              autoFocus
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Country list */}
                        <div className="overflow-y-auto p-1.5 space-y-0.5" style={{ maxHeight: '220px' }}>
                          {filteredCountries.map(c => {
                            const isSelected = selectedCountry.code === c.code;
                            return (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryDropdownOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                                  isSelected
                                    ? 'bg-tech-blue text-white font-bold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                <CountryFlag code={c.code} size={20} />
                                <span className="flex-1 truncate text-[11px]">{c.name}</span>
                                <span
                                  className={`font-mono text-[11px] shrink-0 px-1.5 py-0.5 rounded-md ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {c.dialCode}
                                </span>
                              </button>
                            );
                          })}
                          {filteredCountries.length === 0 && (
                            <div className="text-center py-6 text-xs text-slate-400">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical separator */}
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

                  {/* Phone input */}
                  <input
                    type="tel"
                    id="phone-number-input"
                    autoComplete="tel"
                    placeholder="50 123 4567"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 md:py-3 text-[11px] md:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
                  />
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0 mr-3" />
                </div>
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
      </div>

      {/* Role Notice Card */}
      <div className="p-3 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-[11px] md:text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
          <span>Role Policy Notice</span>
        </div>
        <p className="text-[10px] md:text-[11px] text-slate-500">
          Customer self-registration creates standard client accounts. Reseller partner storefront accounts are provisioned exclusively by NexTech Systems Administration.
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
