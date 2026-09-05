'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Cpu, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

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

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

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
      const { user: authedUser, reseller: resData } = await login(loginEmail, loginPassword);
      handleRoleRedirect(authedUser, resData);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newUser = await register(regName, regEmail, regUsername, regPhone, regPassword);
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
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-tech-blue flex items-center justify-center text-white mx-auto shadow-tech-glow">
          <Cpu className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          NexTech Systems Portal
        </h1>
        <p className="text-xs text-slate-500">
          Unified authentication for Enterprise Clients, Verified Resellers & Administrators
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-tech-card border border-slate-200 dark:border-tech-slate space-y-5 shadow-tech">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(''); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
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
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
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
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || isLoading}
          className="w-full py-3 px-4 bg-slate-50 dark:bg-tech-slate hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
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
              <label className="block text-xs font-bold text-slate-400 mb-1">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="admin@nextech.com or username"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 pl-10 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-400">Password</label>
                <span className="text-[11px] text-tech-cyan">Secure 256-Bit SSL</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 pl-10 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. CREATE CUSTOMER ACCOUNT TAB */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Full Name / Organization</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 pl-10 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Business Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 pl-10 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  placeholder="username"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+971 50..."
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-tech-slate p-3 pl-10 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-tech-blue"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-tech-glow transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating Customer Account...</span>
              ) : (
                <>
                  <span>Create Customer Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Role Notice Card */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role Policy Notice</span>
        </div>
        <p className="text-[11px] text-slate-500">
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
