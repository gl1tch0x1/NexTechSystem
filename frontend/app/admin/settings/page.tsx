'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { removeImageBackground } from '@/lib/background-remover';
import InvoiceStampSignature from '@/components/invoice/InvoiceStampSignature';
import {
  ShieldCheck,
  PenTool,
  UploadCloud,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Save,
  Eye,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { StoreSettings } from '@/types';

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings state
  const [storeName, setStoreName] = useState('NexTech Systems');
  const [supportEmail, setSupportEmail] = useState('support@nextechsystems.ae');
  const [supportPhone, setSupportPhone] = useState('+971 4 800 TECH');
  const [address, setAddress] = useState('NexTech Systems Tower, Silicon Oasis Tech Park, Dubai, UAE');
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState('TRN-10029384910003');
  
  // Stamp state
  const [stampUrl, setStampUrl] = useState<string>('');
  const [stampOriginalUrl, setStampOriginalUrl] = useState<string>('');
  const [showStamp, setShowStamp] = useState(true);
  const [stampTolerance, setStampTolerance] = useState(50);
  const [stampProcessing, setStampProcessing] = useState(false);
  const [stampAutoRemoved, setStampAutoRemoved] = useState(false);

  // Signature state
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatureOriginalUrl, setSignatureOriginalUrl] = useState<string>('');
  const [signatoryName, setSignatoryName] = useState('Eng. Tariq Al-Mansouri');
  const [signatoryTitle, setSignatoryTitle] = useState('Managing Director & Authorized Signatory');
  const [showSignature, setShowSignature] = useState(true);
  const [signatureTolerance, setSignatureTolerance] = useState(55);
  const [signatureProcessing, setSignatureProcessing] = useState(false);
  const [signatureAutoRemoved, setSignatureAutoRemoved] = useState(false);

  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Load existing store settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await ApiClient.get<StoreSettings>('/admin/settings', { token: token || undefined });
        if (res) {
          setStoreName(res.storeName || 'NexTech Systems');
          setSupportEmail(res.supportEmail || 'support@nextechsystems.ae');
          setSupportPhone(res.supportPhone || '+971 4 800 TECH');
          setAddress(res.address || 'NexTech Systems Tower, Silicon Oasis Tech Park, Dubai, UAE');
          setTaxRegistrationNumber(res.taxRegistrationNumber || 'TRN-10029384910003');

          if (res.invoiceStampUrl) {
            setStampUrl(res.invoiceStampUrl);
            setStampOriginalUrl(res.invoiceStampUrl);
          }
          if (res.invoiceSignatureUrl) {
            setSignatureUrl(res.invoiceSignatureUrl);
            setSignatureOriginalUrl(res.invoiceSignatureUrl);
          }
          if (res.signatoryName) setSignatoryName(res.signatoryName);
          if (res.signatoryTitle) setSignatoryTitle(res.signatoryTitle);
          if (res.showStampOnEBill !== undefined) setShowStamp(res.showStampOnEBill);
          if (res.showSignatureOnEBill !== undefined) setShowSignature(res.showSignatureOnEBill);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [token]);

  // Handle Stamp Upload & Background Removal
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStampProcessing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        setStampOriginalUrl(rawDataUrl);

        // Run client-side background removal
        const transparentResult = await removeImageBackground(rawDataUrl, {
          tolerance: stampTolerance,
          feather: 18,
          removeLightPaper: true,
        });

        setStampUrl(transparentResult);
        setStampAutoRemoved(true);
        setStampProcessing(false);
        setToast({
          type: 'success',
          message: 'Stamp background removed automatically! Paper backdrop stripped to transparent PNG.',
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error removing background from stamp:', err);
      setStampProcessing(false);
      setToast({
        type: 'error',
        message: 'Could not remove stamp background: ' + (err.message || 'Unknown error'),
      });
    }
  };

  // Re-process stamp with adjusted tolerance
  const handleReprocessStamp = async (tolerance: number) => {
    if (!stampOriginalUrl) return;
    try {
      setStampProcessing(true);
      const transparentResult = await removeImageBackground(stampOriginalUrl, {
        tolerance,
        feather: 18,
        removeLightPaper: true,
      });
      setStampUrl(transparentResult);
      setStampProcessing(false);
    } catch (err) {
      setStampProcessing(false);
    }
  };

  // Handle Signature Upload & Background Removal
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSignatureProcessing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        setSignatureOriginalUrl(rawDataUrl);

        // Run client-side background removal
        const transparentResult = await removeImageBackground(rawDataUrl, {
          tolerance: signatureTolerance,
          feather: 18,
          removeLightPaper: true,
        });

        setSignatureUrl(transparentResult);
        setSignatureAutoRemoved(true);
        setSignatureProcessing(false);
        setToast({
          type: 'success',
          message: 'Signature background removed automatically! Pen strokes isolated onto transparent PNG.',
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error removing background from signature:', err);
      setSignatureProcessing(false);
      setToast({
        type: 'error',
        message: 'Could not remove signature background: ' + (err.message || 'Unknown error'),
      });
    }
  };

  // Re-process signature with adjusted tolerance
  const handleReprocessSignature = async (tolerance: number) => {
    if (!signatureOriginalUrl) return;
    try {
      setSignatureProcessing(true);
      const transparentResult = await removeImageBackground(signatureOriginalUrl, {
        tolerance,
        feather: 18,
        removeLightPaper: true,
      });
      setSignatureUrl(transparentResult);
      setSignatureProcessing(false);
    } catch (err) {
      setSignatureProcessing(false);
    }
  };

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const payload: Partial<StoreSettings> = {
        storeName,
        supportEmail,
        supportPhone,
        address,
        taxRegistrationNumber,
        invoiceStampUrl: stampUrl,
        invoiceSignatureUrl: signatureUrl,
        signatoryName,
        signatoryTitle,
        showStampOnEBill: showStamp,
        showSignatureOnEBill: showSignature,
      };

      await ApiClient.put('/admin/settings', payload, { token: token || undefined });
      setToast({
        type: 'success',
        message: 'Stamp, signature, and store settings saved successfully! All E-Bills will now reflect your updates.',
      });
    } catch (err: any) {
      console.error('Save failed:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to update store settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-mono animate-pulse">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span>Loading E-Bill &amp; Store Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400 font-mono text-[11px] font-bold">
              FTA COMPLIANCE &amp; BRANDING
            </span>
            <span className="text-xs text-slate-500 font-mono">• UAE VAT E-INVOICE SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            E-Bill Stamp &amp; Signature Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload custom company seals and executive signatures. If you upload a scan or photo with a paper background,
            the system automatically strips the background to ensure pure transparent ink overlays on all electronic bills.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium leading-relaxed">{toast.message}</div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Stamp & Signature Upload Tools */}
        <div className="lg:col-span-7 space-y-8">
          {/* Card 1: Official Corporate Stamp Upload */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Official Corporate Stamp / Seal
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Custom company circular or rectangular rubber stamp design.
                </p>
              </div>

              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <span>Display on E-Bills</span>
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={e => setShowStamp(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Checkered Canvas Preview Area */}
            <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
              {stampProcessing ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                  <span className="text-xs font-mono font-bold text-blue-600">
                    Removing paper background &amp; isolating transparent ink...
                  </span>
                </div>
              ) : stampUrl ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="relative w-40 h-40 p-2 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700 shadow-sm flex items-center justify-center">
                    <Image
                      src={stampUrl}
                      alt="Uploaded Transparent Stamp"
                      width={160}
                      height={160}
                      unoptimized
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  {stampAutoRemoved && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Background Removal Applied (Transparent Ink)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => stampInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Replace Stamp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStampUrl('');
                        setStampOriginalUrl('');
                        setStampAutoRemoved(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-xs font-bold text-red-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Use Default UAE Seal</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => stampInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline underline-offset-4"
                    >
                      Upload Stamp Design
                    </button>
                    <span className="text-xs text-slate-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    PNG, JPG, or Scanned Image. White paper backgrounds are automatically removed into transparent ink.
                  </p>
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      Currently Using: Official Bilingual UAE Corporate Seal (Default)
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={stampInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleStampUpload}
                className="hidden"
              />
            </div>

            {/* Background Removal Tolerance Fine-Tuning Slider */}
            {stampOriginalUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Background Removal Sensitivity (Tolerance)</span>
                  </span>
                  <span className="font-mono text-blue-600 dark:text-cyan-400">{stampTolerance}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="110"
                  value={stampTolerance}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setStampTolerance(val);
                    handleReprocessStamp(val);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Preserve Faint Ink (Low)</span>
                  <span>Strip Stubborn Paper (High)</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Authorized Signatory & Signature Upload */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Authorized Signatory &amp; Signature
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Signatory name, official title, and executive calligraphy signature.
                </p>
              </div>

              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <span>Display on E-Bills</span>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={e => setShowSignature(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Checkered Canvas Preview Area */}
            <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
              {signatureProcessing ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <RefreshCw className="w-7 h-7 text-purple-600 animate-spin" />
                  <span className="text-xs font-mono font-bold text-purple-600">
                    Extracting pen strokes &amp; removing white background...
                  </span>
                </div>
              ) : signatureUrl ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="relative w-56 h-20 p-2 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700 shadow-sm flex items-center justify-center">
                    <Image
                      src={signatureUrl}
                      alt="Uploaded Transparent Signature"
                      width={224}
                      height={80}
                      unoptimized
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  </div>

                  {signatureAutoRemoved && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Background Removal Applied (Transparent Ink)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Replace Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureUrl('');
                        setSignatureOriginalUrl('');
                        setSignatureAutoRemoved(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-xs font-bold text-red-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Use Default Signature</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4"
                    >
                      Upload Signature Photo / Scan
                    </button>
                    <span className="text-xs text-slate-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Sign on paper and take a photo. Our system automatically deletes the paper and isolates the ink strokes.
                  </p>
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      Currently Using: Authorized Vector Calligraphy (Default)
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </div>

            {/* Background Removal Tolerance Fine-Tuning Slider */}
            {signatureOriginalUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                    <span>Background Removal Sensitivity (Tolerance)</span>
                  </span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">{signatureTolerance}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="110"
                  value={signatureTolerance}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSignatureTolerance(val);
                    handleReprocessSignature(val);
                  }}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Preserve Thin Pen Strokes (Low)</span>
                  <span>Strip White Paper Halos (High)</span>
                </div>
              </div>
            )}

            {/* Signatory Text Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Signatory Full Name
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={e => setSignatoryName(e.target.value)}
                  placeholder="e.g. Eng. Tariq Al-Mansouri"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Signatory Official Designation
                </label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={e => setSignatoryTitle(e.target.value)}
                  placeholder="e.g. Managing Director & Authorized Signatory"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Enterprise Legal Header Info */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Legal Entity &amp; FTA Tax Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Store / Legal Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax Registration Number (TRN)</label>
                <input
                  type="text"
                  value={taxRegistrationNumber}
                  onChange={e => setTaxRegistrationNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support / Billing Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive E-Bill Document Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live E-Bill Document Preview
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              WYSIWYG Print &amp; PDF View
            </span>
          </div>

          {/* Mini Invoice Preview Card */}
          <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-7 shadow-xl border border-slate-200 space-y-6">
            {/* Header snippet */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <div className="text-base font-black tracking-tight text-slate-900">
                  {storeName || 'NEXTECH SYSTEMS'}
                </div>
                <div className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                  Official Tax Invoice • فاتورة ضريبية
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  TRN: {taxRegistrationNumber || '10029384910003'}
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <div className="font-bold text-slate-900">INV-2026-90412</div>
                <div className="text-[10px] text-emerald-600 font-bold">PAID &amp; SETTLED</div>
              </div>
            </div>

            {/* Dummy line items */}
            <div className="text-xs space-y-2 py-2">
              <div className="flex justify-between font-mono text-[11px] text-slate-500 border-b pb-1">
                <span>Item</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between font-mono text-xs">
                <span>ASUS ROG Matrix GeForce RTX 4090 24GB</span>
                <span className="font-bold">AED 13,850.00</span>
              </div>
              <div className="flex justify-between font-mono text-xs text-slate-500">
                <span>Standard Insured GCC Shipping</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between font-mono text-xs text-slate-500">
                <span>UAE VAT (5.00%)</span>
                <span>AED 692.50</span>
              </div>
              <div className="flex justify-between font-mono text-sm font-black pt-2 border-t border-slate-900">
                <span>Total Payable:</span>
                <span className="text-blue-600">AED 14,542.50</span>
              </div>
            </div>

            {/* LIVE STAMP & SIGNATURE RENDER */}
            <InvoiceStampSignature
              stampUrl={stampUrl}
              signatureUrl={signatureUrl}
              signatoryName={signatoryName}
              signatoryTitle={signatoryTitle}
              showStamp={showStamp}
              showSignature={showSignature}
              verificationDate="06/10/2026"
              documentRef="NX-2026-90412"
              companyTrn={taxRegistrationNumber}
              className="mt-4"
            />
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
              When customers or administrators click <strong>Print Official Invoice</strong> or download as PDF,
              the stamp and signature will retain exact colors, transparent layering, and vector clarity without pixelation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
