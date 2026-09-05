'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient, getApiUrl } from '@/lib/api-client';
import { ProductImportPreviewResponse, ProductImportRow } from '@/types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function ResellerProductImportPage() {
  const params = useParams();
  const router = useRouter();
  const resellerCode = params.code as string;
  const { token } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ProductImportPreviewResponse | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'SKIP' | 'UPDATE'>('SKIP');
  const [isExecuting, setIsExecuting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; updatedCount: number; skippedCount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
      setErrorMessage('');
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file || !token) return;
    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await ApiClient.post<ProductImportPreviewResponse>('/reseller/import/preview', formData, { token });
      setPreviewData(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to parse Excel file. Please verify column formatting.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || !token) return;
    setIsExecuting(true);
    setErrorMessage('');

    try {
      const productsToImport = previewData.rows
        .filter(r => r.isValid)
        .map(r => r.normalizedProduct!);

      const result = await ApiClient.post<{ importedCount: number; updatedCount: number; skippedCount: number }>(
        '/reseller/import/execute',
        {
          reportId: previewData.reportId,
          products: productsToImport,
          duplicateAction,
        },
        { token }
      );

      setImportResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to execute import.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(getApiUrl('/reseller/template/download'), '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1">
            Bulk Product Management Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-amber-400" />
            Excel & CSV Hardware Product Importer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic column header detection, automatic data mapping, missing-field red alerts, and duplicate SKU detection.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 shadow transition-colors"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Download Official Template (.xlsx)</span>
        </button>
      </div>

      {/* Step 1: Upload File Area */}
      {!previewData && !importResult && (
        <div className="p-8 rounded-3xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-amber-500/50 transition-all text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Upload Your Hardware Product Spreadsheet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Supports Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) and standard CSV files. Our engine automatically detects variations like &ldquo;Item Name&rdquo;, &ldquo;Qty&rdquo;, &ldquo;MSRP&rdquo;, etc.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="excel-upload"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer shadow transition-colors"
            >
              {file ? `Selected: ${file.name}` : 'Browse Local File'}
            </label>

            {file && (
              <button
                disabled={isUploading}
                onClick={handleUploadAndAnalyze}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow transition-all"
              >
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isUploading ? 'Analyzing Spreadsheet...' : 'Analyze & Map Columns'}</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-semibold max-w-md mx-auto">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Interactive Preview & Missing Field Red Alerts */}
      {previewData && !importResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 font-bold uppercase">Total Rows Detected</div>
              <div className="text-2xl font-black text-white mt-1">{previewData.totalRows}</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-900/40">
              <div className="text-xs text-emerald-400 font-bold uppercase">Valid & Ready Rows</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{previewData.validRowsCount}</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950 border border-red-900/40">
              <div className="text-xs text-red-400 font-bold uppercase">Missing Required Fields</div>
              <div className="text-2xl font-black text-red-400 mt-1">{previewData.errorRowsCount}</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-900/40">
              <div className="text-xs text-amber-400 font-bold uppercase">Duplicate SKUs</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{previewData.duplicateRowsCount}</div>
            </div>
          </div>

          {/* Detected Column Auto-Mapping Preview */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Automatic Column Mapping Verification
              </h3>
              <span className="text-[11px] text-slate-400">High-confidence schema detection</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(previewData.columnMappings).map(([rawHeader, canonicalKey]) => (
                <div
                  key={rawHeader}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2"
                >
                  <span className="text-slate-300 font-bold">{rawHeader}</span>
                  <span className="text-slate-500">→</span>
                  <span className="font-mono text-amber-400 font-semibold">{canonicalKey}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Row-by-Row Table with RED ERROR BADGES */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Import Row Diagnostics Table</h3>
              <span className="text-xs text-slate-400">
                Rows highlighted in <span className="text-red-400 font-bold">RED</span> contain missing mandatory fields
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Row #</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Product Name</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Stock</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Diagnostic Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {previewData.rows.map(row => {
                    const hasErrors = !row.isValid;
                    return (
                      <tr
                        key={row.rowNumber}
                        className={
                          hasErrors
                            ? 'bg-red-950/20 text-red-200 border-l-4 border-l-red-500'
                            : 'hover:bg-slate-900/60'
                        }
                      >
                        <td className="py-3 px-2 font-mono font-bold text-slate-400">{row.rowNumber}</td>
                        <td className="py-3 px-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                              <XCircle className="w-3 h-3" /> Incomplete
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-bold max-w-xs truncate">
                          {row.normalizedProduct?.name || <span className="text-red-400 font-bold">❌ MISSING NAME</span>}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {row.normalizedProduct?.sku || <span className="text-red-400 font-bold">❌ MISSING SKU</span>}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {row.normalizedProduct?.price ? `AED ${row.normalizedProduct.price}` : <span className="text-red-400 font-bold">❌ NO PRICE</span>}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {row.normalizedProduct?.stock != null ? row.normalizedProduct.stock : <span className="text-red-400 font-bold">❌ NO QTY</span>}
                        </td>
                        <td className="py-3 px-2">
                          {row.normalizedProduct?.categoryName || <span className="text-red-400 font-bold">❌ NO CATEGORY</span>}
                        </td>
                        <td className="py-3 px-2">
                          {row.missingRequiredFields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {row.missingRequiredFields.map(f => (
                                <span
                                  key={f}
                                  className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shadow"
                                >
                                  Missing {f}
                                </span>
                              ))}
                            </div>
                          )}
                          {row.isDuplicateSku && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 ml-1">
                              Duplicate SKU Warning
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Controls & Confirmation */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-300">Duplicate SKU Handling:</div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    checked={duplicateAction === 'SKIP'}
                    onChange={() => setDuplicateAction('SKIP')}
                  />
                  <span>Skip existing catalog duplicates</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    checked={duplicateAction === 'UPDATE'}
                    onChange={() => setDuplicateAction('UPDATE')}
                  />
                  <span>Update existing price & stock</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel / Re-upload
              </button>

              <button
                disabled={isExecuting || previewData.validRowsCount === 0}
                onClick={handleExecuteImport}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-tech transition-all"
              >
                <span>
                  {isExecuting
                    ? 'Importing Products to Catalog...'
                    : `Confirm & Import ${previewData.validRowsCount} Valid Products`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success Report */}
      {importResult && (
        <div className="p-8 rounded-3xl bg-slate-950 border border-emerald-900/60 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Products Imported Successfully!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Your hardware items have been imported and submitted for Admin catalog approval with status <code>PENDING_APPROVAL</code>.
            </p>
          </div>

          <div className="flex justify-center gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-[120px]">
              <div className="text-slate-400">New Created</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{importResult.importedCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-[120px]">
              <div className="text-slate-400">Updated</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{importResult.updatedCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-[120px]">
              <div className="text-slate-400">Skipped</div>
              <div className="text-2xl font-black text-slate-400 mt-1">{importResult.skippedCount}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href={`/reseller/${resellerCode}/products`}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
            >
              View My Products Catalog
            </Link>
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setImportResult(null);
              }}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
