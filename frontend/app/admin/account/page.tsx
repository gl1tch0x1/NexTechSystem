'use client';

import { useState, type FormEvent } from 'react';
import { LockKeyhole, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';

export default function AdminAccountPage() {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (!token) {
      setError('Sign in again to change your password.');
      return;
    }

    setSaving(true);
    try {
      const result = await ApiClient.put<{ message: string }>('/auth/password', { currentPassword, newPassword }, { token });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(result.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password could not be changed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-purple-600/10 p-3 text-purple-600 dark:text-purple-300"><ShieldCheck className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-300">Administrator</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the password used to access your admin account.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
          <LockKeyhole className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Change password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as {user?.email || 'administrator'}</p>
          </div>
        </div>

        <form onSubmit={submit} className="max-w-md space-y-5">
          <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" minLength={8} />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8} />
          <p className="text-xs text-slate-500 dark:text-slate-400">Use 8 to 128 characters. Choose a password you have not used for this account.</p>
          {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          {success && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60">
            {saving ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete, minLength }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      <input type="password" required minLength={minLength} maxLength={128} autoComplete={autoComplete} value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
    </label>
  );
}
