'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Info,
  Eraser,
  ExternalLink,
  Link2,
  Stamp
} from 'lucide-react';
import { StoreSettings } from '@/types';

// Preset calligraphic signatures
const PRESET_SIGNATURES = [
  {
    id: 'exec_tariq',
    name: 'Eng. Tariq Al-Mansouri (Default)',
    title: 'Managing Director & Authorized Signatory',
    svgUrl: '', // Default vector fallback in InvoiceStampSignature
  },
  {
    id: 'exec_karim',
    name: 'Karim Al-Husseini',
    title: 'Chief Financial Officer & Comptroller',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80" fill="none" stroke="%231e3a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 50 Q40 15 65 35 T110 40 T150 25 T190 45 Q220 20 240 30 M30 45 L230 48 M70 20 L80 60"/></svg>',
  },
  {
    id: 'exec_zayed',
    name: 'Dr. Zayed Al-Hashemi',
    title: 'Senior Partner & General Counsel',
    svgUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80" fill="none" stroke="%231e293b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 60 C35 20, 60 10, 80 40 C95 60, 110 30, 130 20 C150 10, 170 45, 195 35 C215 25, 230 35, 245 28 M30 52 Q130 42 225 50 M100 25 L115 58"/></svg>',
  },
];

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // General Store info
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
  const [stampUrlInput, setStampUrlInput] = useState('');
  const [showStampUrlForm, setShowStampUrlForm] = useState(false);

  // Signature state
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatureOriginalUrl, setSignatureOriginalUrl] = useState<string>('');
  const [signatoryName, setSignatoryName] = useState('Eng. Tariq Al-Mansouri');
  const [signatoryTitle, setSignatoryTitle] = useState('Managing Director & Authorized Signatory');
  const [showSignature, setShowSignature] = useState(true);
  const [signatureTolerance, setSignatureTolerance] = useState(55);
  const [signatureProcessing, setSignatureProcessing] = useState(false);
  const [signatureAutoRemoved, setSignatureAutoRemoved] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'upload' | 'draw' | 'url' | 'presets'>('upload');
  const [signatureUrlInput, setSignatureUrlInput] = useState('');

  // Signature Drawing Pad Canvas State
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnContent, setHasDrawnContent] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a'); // Imperial blue ink

  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Load existing store settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
        const res = await ApiClient.get<StoreSettings>('/admin/settings', { token: activeToken || undefined });
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

  // Track changes
  const markChanged = () => setHasChanges(true);

  // ==========================================
  // STAMP LOGIC
  // ==========================================
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStampProcessing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        setStampOriginalUrl(rawDataUrl);

        try {
          const transparentResult = await removeImageBackground(rawDataUrl, {
            tolerance: stampTolerance,
            feather: 18,
            removeLightPaper: true,
          });
          setStampUrl(transparentResult);
          setStampAutoRemoved(true);
          setToast({
            type: 'success',
            message: 'Stamp background removed automatically! Paper backdrop stripped to transparent PNG.',
          });
        } catch {
          // Resilient fallback to raw image
          setStampUrl(rawDataUrl);
          setStampAutoRemoved(false);
        }
        markChanged();
        setStampProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error handling stamp upload:', err);
      setStampProcessing(false);
    }
  };

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
      markChanged();
    } catch (err) {
      console.warn('Reprocess failed:', err);
    } finally {
      setStampProcessing(false);
    }
  };

  const handleApplyStampUrl = () => {
    if (!stampUrlInput.trim()) return;
    setStampUrl(stampUrlInput.trim());
    setStampOriginalUrl(stampUrlInput.trim());
    setStampAutoRemoved(false);
    setShowStampUrlForm(false);
    setStampUrlInput('');
    markChanged();
    setToast({
      type: 'success',
      message: 'Custom stamp URL applied! Make sure to click Save Settings.',
    });
  };

  // ==========================================
  // SIGNATURE LOGIC
  // ==========================================
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSignatureProcessing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        setSignatureOriginalUrl(rawDataUrl);

        try {
          const transparentResult = await removeImageBackground(rawDataUrl, {
            tolerance: signatureTolerance,
            feather: 18,
            removeLightPaper: true,
          });
          setSignatureUrl(transparentResult);
          setSignatureAutoRemoved(true);
          setToast({
            type: 'success',
            message: 'Signature background removed automatically! Isolated ink strokes on transparent PNG.',
          });
        } catch {
          setSignatureUrl(rawDataUrl);
          setSignatureAutoRemoved(false);
        }
        markChanged();
        setSignatureProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error handling signature upload:', err);
      setSignatureProcessing(false);
    }
  };

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
      markChanged();
    } catch (err) {
      console.warn('Reprocess signature failed:', err);
    } finally {
      setSignatureProcessing(false);
    }
  };

  const handleApplySignatureUrl = () => {
    if (!signatureUrlInput.trim()) return;
    setSignatureUrl(signatureUrlInput.trim());
    setSignatureOriginalUrl(signatureUrlInput.trim());
    setSignatureAutoRemoved(false);
    setSignatureUrlInput('');
    markChanged();
    setToast({
      type: 'success',
      message: 'Custom signature URL applied! Make sure to click Save Settings.',
    });
  };

  // ==========================================
  // DIGITAL SIGNATURE DRAWING PAD
  // ==========================================
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnContent(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawingPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnContent(false);
  };

  const applyDrawnSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas || !hasDrawnContent) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    setSignatureOriginalUrl(dataUrl);
    setSignatureAutoRemoved(true);
    markChanged();
    setToast({
      type: 'success',
      message: 'Handwritten signature captured onto transparent PNG! Ready to save.',
    });
  };

  // ==========================================
  // SAVE SETTINGS HANDLER
  // ==========================================
  const handleSave = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
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

      await ApiClient.put('/admin/settings', payload, { token: activeToken || undefined });
      setHasChanges(false);
      setToast({
        type: 'success',
        message: 'Signature, stamp, and store settings updated and published successfully! All customer E-Bills and invoices are now synced.',
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
  }, [
    token,
    storeName,
    supportEmail,
    supportPhone,
    address,
    taxRegistrationNumber,
    stampUrl,
    signatureUrl,
    signatoryName,
    signatoryTitle,
    showStamp,
    showSignature,
  ]);

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
    <div className="space-y-8 pb-24">
      {/* Top Header */}
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
            Configure authorized company stamps and executive signatures. Upload any scan/photo on paper (the background is automatically stripped to pure transparent ink), or draw your signature directly with our on-screen pen tool.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/orders/order_120c9356-1b17-4760-bb26-52be40f53216/invoice"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Sample E-Bill</span>
          </Link>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Management Cards */}
        <div className="lg:col-span-7 space-y-8">
          {/* ========================================================= */}
          {/* CARD 1: AUTHORIZED SIGNATURE (HIGHLIGHTED & ENHANCED)     */}
          {/* ========================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/50 shadow-sm space-y-6">
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
                  Update the official executive signature stamped on all customer Tax Invoices &amp; E-Bills.
                </p>
              </div>

              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <span>Show on E-Bills</span>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={e => {
                    setShowSignature(e.target.checked);
                    markChanged();
                  }}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Signature Creation Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSignatureMode('upload')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  signatureMode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📁 Upload Photo / Scan
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  signatureMode === 'draw'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🖊️ Draw Signature Pad
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('presets')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  signatureMode === 'presets'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ✨ Executive Presets
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('url')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  signatureMode === 'url'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🌐 Image URL
              </button>
            </div>

            {/* TAB 1: DRAW SIGNATURE PAD */}
            {signatureMode === 'draw' && (
              <div className="space-y-4 p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Sign on the Pad Below
                    </span>
                    <span className="text-[10px] text-slate-400">(Touch or Mouse)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Ink Color:</span>
                    <button
                      type="button"
                      onClick={() => setPenColor('#1e3a8a')}
                      className={`w-5 h-5 rounded-full bg-blue-900 border-2 ${penColor === '#1e3a8a' ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}`}
                      title="Blue Ink"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#0f172a')}
                      className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${penColor === '#0f172a' ? 'border-white ring-2 ring-slate-500' : 'border-transparent'}`}
                      title="Black Ink"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#581c87')}
                      className={`w-5 h-5 rounded-full bg-purple-900 border-2 ${penColor === '#581c87' ? 'border-white ring-2 ring-purple-500' : 'border-transparent'}`}
                      title="Purple Ink"
                    />
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
                  <canvas
                    ref={sigCanvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 cursor-crosshair touch-none"
                  />
                  {!hasDrawnContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Draw your signature here...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={clearDrawingPad}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Pad</span>
                  </button>

                  <button
                    type="button"
                    disabled={!hasDrawnContent}
                    onClick={applyDrawnSignature}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md disabled:opacity-40 transition-all inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply Signature to E-Bill</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PRESET CALLIGRAPHY */}
            {signatureMode === 'presets' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select an Executive Calibrated Signature Preset:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {PRESET_SIGNATURES.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSignatureUrl(preset.svgUrl);
                        setSignatureOriginalUrl(preset.svgUrl);
                        setSignatoryName(preset.name.replace(' (Default)', ''));
                        setSignatoryTitle(preset.title);
                        setSignatureAutoRemoved(false);
                        markChanged();
                        setToast({
                          type: 'success',
                          message: `Selected ${preset.name}! Ready to save.`,
                        });
                      }}
                      className="p-3 rounded-xl border text-left transition-all hover:border-purple-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="h-10 flex items-center justify-center">
                        <PenTool className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {preset.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: IMAGE URL INPUT */}
            {signatureMode === 'url' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Direct Signature Image URL (PNG / SVG)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={signatureUrlInput}
                    onChange={e => setSignatureUrlInput(e.target.value)}
                    placeholder="https://example.com/assets/executive-signature.png"
                    className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplySignatureUrl}
                    className="px-4 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            )}

            {/* Checkered Canvas Preview Box (Active for all modes) */}
            <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
              {signatureProcessing ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <RefreshCw className="w-7 h-7 text-purple-600 animate-spin" />
                  <span className="text-xs font-mono font-bold text-purple-600">
                    Extracting pen strokes &amp; removing white background...
                  </span>
                </div>
              ) : signatureUrl ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="relative w-64 h-24 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700 shadow-sm flex items-center justify-center">
                    <Image
                      src={signatureUrl}
                      alt="Uploaded Transparent Signature"
                      width={256}
                      height={96}
                      unoptimized
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  </div>

                  {signatureAutoRemoved && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3 h-3" />
                      <span>Transparent Background Applied (Clean Ink)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Upload New File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureUrl('');
                        setSignatureOriginalUrl('');
                        setSignatureAutoRemoved(false);
                        markChanged();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-xs font-bold text-red-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset to Default</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4"
                    >
                      Upload Signature Image
                    </button>
                    <span className="text-xs text-slate-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Sign on paper and take a photo. Our system automatically deletes the paper background.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      Currently Active: Official Caligraphic Vector Signature (Default)
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </div>

            {/* Background Removal Tolerance Slider */}
            {signatureOriginalUrl && !signatureOriginalUrl.startsWith('data:image/svg+xml') && (
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
                  onChange={e => {
                    setSignatoryName(e.target.value);
                    markChanged();
                  }}
                  placeholder="e.g. Eng. Tariq Al-Mansouri"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Signatory Official Designation
                </label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={e => {
                    setSignatoryTitle(e.target.value);
                    markChanged();
                  }}
                  placeholder="e.g. Managing Director & Authorized Signatory"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>
            </div>

            {/* Inline Card Save Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Signature to E-Bills</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARD 2: OFFICIAL CORPORATE STAMP / SEAL                   */}
          {/* ========================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Official Company Stamp / Seal
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload custom circular or rectangular company seal. Paper backdrops are auto-stripped.
                </p>
              </div>

              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <span>Show on E-Bills</span>
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={e => {
                    setShowStamp(e.target.checked);
                    markChanged();
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Stamp Action Tabs */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Stamp File</span>
              </button>
              <button
                type="button"
                onClick={() => setShowStampUrlForm(!showStampUrlForm)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Enter Image URL</span>
              </button>
            </div>

            {/* Stamp URL Input */}
            {showStampUrlForm && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stamp Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={stampUrlInput}
                    onChange={e => setStampUrlInput(e.target.value)}
                    placeholder="https://example.com/assets/corporate-seal.png"
                    className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyStampUrl}
                    className="px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Checkered Canvas Preview Box */}
            <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
              {stampProcessing ? (
                <div className="py-10 flex flex-col items-center gap-3">
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
                      <span>Transparent Background Applied (Clean Stamp)</span>
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
                        markChanged();
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
                    <Stamp className="w-6 h-6" />
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
                    PNG, JPG, or Scanned Image. Paper backgrounds are automatically stripped into transparent ink.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      Currently Active: Bilingual UAE Corporate Tax Seal (Default)
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={stampInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                onChange={handleStampUpload}
                className="hidden"
              />
            </div>

            {/* Background Removal Tolerance Slider */}
            {stampOriginalUrl && !stampOriginalUrl.startsWith('data:image/svg+xml') && (
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

            {/* Inline Card Save Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Stamp to E-Bills</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARD 3: LEGAL ENTITY & TAX INFO                           */}
          {/* ========================================================= */}
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
                  onChange={e => {
                    setStoreName(e.target.value);
                    markChanged();
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax Registration Number (TRN)</label>
                <input
                  type="text"
                  value={taxRegistrationNumber}
                  onChange={e => {
                    setTaxRegistrationNumber(e.target.value);
                    markChanged();
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support / Billing Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => {
                    setSupportEmail(e.target.value);
                    markChanged();
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={e => {
                    setSupportPhone(e.target.value);
                    markChanged();
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => {
                    setAddress(e.target.value);
                    markChanged();
                  }}
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
              <Eye className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live E-Bill Document Preview
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              Real-Time WYSIWYG
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

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-900 dark:text-purple-300 leading-relaxed">
              When customers or administrators click <strong>Print Official Invoice</strong> or download as PDF,
              your updated stamp and signature will overlay automatically with transparent paper background removal.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Bar for Instant Saving */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold">You have unsaved stamp / signature changes</span>
          </div>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
