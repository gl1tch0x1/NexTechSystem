'use client';

import { Scale } from 'lucide-react';

export const DEFAULT_INVOICE_TERMS = [
  '1. Tax Compliance: Issued in full accordance with UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax (VAT) and Federal Tax Authority (FTA) statutes. Official TRN: 10029384910003.',
  '2. Manufacturer Warranty: All hardware components, GPUs, workstations, and server hardware include official OEM Middle East regional warranty coverage. Serial numbers are cryptographically recorded in the NexTech enterprise warranty registry.',
  '3. Inspection & Returns: Goods must be inspected upon delivery. Unopened items in original factory packaging may be returned within 14 calendar days. Custom-built PC workstations, special-order server racks, and activated digital licenses are strictly non-refundable.',
  '4. Title & Reservation of Ownership: Ownership and title of all goods remain with NexTech Systems FZ-LLC until payment has cleared in full. Risk of loss passes to the purchaser upon formal carrier handover or verified delivery signature.',
  '5. Applicable Law & Jurisdiction: This tax invoice and commercial contract are governed by and construed under the federal laws of the United Arab Emirates and the exclusive jurisdiction of the Courts of Dubai.'
];

interface InvoiceTermsAndConditionsProps {
  customTerms?: string | null;
  className?: string;
  variant?: 'compact' | 'detailed';
}

export function InvoiceTermsAndConditions({
  customTerms,
  className = '',
  variant = 'compact'
}: InvoiceTermsAndConditionsProps) {
  // Parse custom terms if provided as multiline text, otherwise use default clauses
  const termsList = customTerms && customTerms.trim().length > 0
    ? customTerms.split('\n').filter(line => line.trim().length > 0)
    : DEFAULT_INVOICE_TERMS;

  const isCompact = variant === 'compact';

  return (
    <div
      className={`border-t border-slate-200 text-slate-700 print:text-slate-800 print:border-slate-300 print:break-inside-avoid ${isCompact ? 'py-2' : 'py-4'} ${className}`}
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <div className="pt-4 pb-2 space-y-2">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 print:text-slate-900 text-xs">
            <Scale className="w-3.5 h-3.5 text-blue-600 print:text-blue-800" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Terms &amp; Conditions / الشروط والأحكام الرسمية
            </span>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 print:text-slate-500 hidden sm:inline">
            UAE Commercial Code &bull; Law No. 8 of 2017
          </span>
        </div>

        {/* Clauses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] sm:text-[10.5px] print:text-[8.5px] leading-relaxed text-slate-600 print:text-slate-700 font-sans">
          {termsList.map((clause, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-blue-600 print:text-blue-800 font-bold shrink-0 mt-0.5">•</span>
              <p className="space-y-0.5">
                {clause.replace(/^[0-9]+[\.\)]\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InvoiceTermsAndConditions;
