'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient, getApiUrl } from '@/lib/api-client';
import { ProductImportPreviewResponse } from '@/types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function ResellerProductImportPage() {
  const params = useParams();
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
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.toLowerCase().split('.').pop() || '';
      if (!['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
        setErrorMessage('Only .xlsx, .xls, and .csv files are supported. Please select a valid spreadsheet file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>High-Throughput Catalog Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-amber-500" />
            <span>Excel & CSV Bulk Product Importer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic column header detection, automatic attribute mapping, and instant diagnostic error checks.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>Download Excel Template (.xlsx)</span>
        </button>
      </div>

      {/* Step 1: Upload File Area with Crisp Light Theme */}
      {!previewData && !importResult && (
        <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-slate-200 hover:border-amber-400 transition-all text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto shadow-xs">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">Upload Your Hardware Spreadsheet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Supports Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) and standard CSV files. Our schema engine automatically maps SKU, Title, MSRP, Stock, Category, and Specs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="excel-upload"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer shadow-xs transition-colors"
            >
              {file ? `Selected: ${file.name}` : 'Browse Spreadsheet File'}
            </label>

            {file && (
              <button
                disabled={isUploading}
                onClick={handleUploadAndAnalyze}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isUploading ? 'Analyzing Spreadsheet...' : 'Analyze & Map Columns'}</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold max-w-md mx-auto flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Interactive Preview & Missing Field Red Alerts */}
      {previewData && !importResult && (
        <div className="space-y-6">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-mono font-bold uppercase">Total Rows Detected</div>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">{previewData.totalRows}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
              <div className="text-[11px] text-emerald-800 font-mono font-bold uppercase">Valid & Ready Rows</div>
              <div className="text-3xl font-black text-emerald-700 font-mono mt-1">{previewData.validRowsCount}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs">
              <div className="text-[11px] text-rose-800 font-mono font-bold uppercase">Missing Fields</div>
              <div className="text-3xl font-black text-rose-700 font-mono mt-1">{previewData.errorRowsCount}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs">
              <div className="text-[11px] text-amber-900 font-mono font-bold uppercase">Duplicate SKUs</div>
              <div className="text-3xl font-black text-amber-800 font-mono mt-1">{previewData.duplicateRowsCount}</div>
            </div>
          </div>

          {/* Detected Column Auto-Mapping Preview */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Automatic Schema Mapping Verification</span>
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold font-mono">100% Verified</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(previewData.columnMappings).map(([rawHeader, canonicalKey]) => (
                <div
                  key={rawHeader}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2"
                >
                  <span className="text-slate-700 font-bold">{rawHeader}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-mono text-amber-800 font-semibold">{canonicalKey}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Rows Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Import Row Diagnostics</h3>
              <span className="text-xs text-slate-500">
                Rows flagged with missing fields will be safely skipped unless corrected.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Row #</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Product Title</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Price (AED)</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.rows.map(row => {
                    const hasErrors = !row.isValid;
                    return (
                      <tr
                        key={row.rowNumber}
                        className={
                          hasErrors
                            ? 'bg-rose-50/50 text-rose-950 border-l-4 border-l-rose-500'
                            : 'hover:bg-slate-50/80 transition-colors'
                        }
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{row.rowNumber}</td>
                        <td className="py-3 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Incomplete
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold max-w-xs truncate text-slate-900">
                          {row.normalizedProduct?.name || <span className="text-rose-600 font-bold">Missing Title</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {row.normalizedProduct?.sku || <span className="text-rose-600 font-bold">Missing SKU</span>}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {row.normalizedProduct?.price ? `AED ${row.normalizedProduct.price}` : <span className="text-rose-600">No Price</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          {row.normalizedProduct?.stock != null ? `${row.normalizedProduct.stock} qty` : <span className="text-rose-600">0</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {row.normalizedProduct?.categoryName || 'General Hardware'}
                        </td>
                        <td className="py-3 px-3">
                          {row.missingRequiredFields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {row.missingRequiredFields.map(f => (
                                <span
                                  key={f}
                                  className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs"
                                >
                                  Missing {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">Duplicate SKU Action:</div>
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    checked={duplicateAction === 'SKIP'}
                    onChange={() => setDuplicateAction('SKIP')}
                  />
                  <span>Skip existing duplicates</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
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
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel / Re-upload
              </button>

              <button
                disabled={isExecuting || previewData.validRowsCount === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isExecuting
                    ? 'Importing...'
                    : `Confirm & Import ${previewData.validRowsCount} Valid SKUs`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success Report */}
      {importResult && (
        <div className="p-10 rounded-3xl bg-white border border-emerald-300 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Hardware Catalog Imported Successfully!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your hardware items have been imported and submitted for Admin catalog verification with status <code>PENDING_APPROVAL</code>.
            </p>
          </div>

          <div className="flex justify-center gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 min-w-[120px]">
              <div className="text-emerald-800 font-bold">New Created</div>
              <div className="text-3xl font-black text-emerald-700 font-mono mt-1">{importResult.importedCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 min-w-[120px]">
              <div className="text-amber-900 font-bold">Updated</div>
              <div className="text-3xl font-black text-amber-800 font-mono mt-1">{importResult.updatedCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-[120px]">
              <div className="text-slate-500 font-bold">Skipped</div>
              <div className="text-3xl font-black text-slate-700 font-mono mt-1">{importResult.skippedCount}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href={`/reseller/${resellerCode}/products`}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs"
            >
              View My Products Catalog
            </Link>
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setImportResult(null);
              }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
