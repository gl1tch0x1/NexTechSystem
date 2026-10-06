'use client';

import Image from 'next/image';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface InvoiceStampSignatureProps {
  stampUrl?: string | null;
  signatureUrl?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  showStamp?: boolean;
  showSignature?: boolean;
  verificationDate?: string | null;
  documentRef?: string | null;
  companyTrn?: string | null;
  className?: string;
  variant?: 'full' | 'compact';
}

/**
 * Authentic Corporate SVG Stamp Fallback
 * Used when no custom stamp is uploaded by the admin.
 */
function DefaultCorporateStamp() {
  return (
    <div className="relative w-32 h-32 select-none pointer-events-none transform -rotate-6 transition-transform hover:rotate-0">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-blue-700/80 drop-shadow-sm fill-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Rings */}
        <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="3" strokeDasharray="6 3" />
        <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="66" stroke="currentColor" strokeWidth="1.5" />

        {/* Circular Curved Texts */}
        <path id="stamp-curve-top" d="M 28 100 A 72 72 0 0 1 172 100" fill="none" />
        <path id="stamp-curve-bottom" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />

        <text className="text-[10.5px] font-black uppercase tracking-widest fill-current">
          <textPath href="#stamp-curve-top" startOffset="50%" textAnchor="middle">
            NEXTECH SYSTEMS FZ-LLC
          </textPath>
        </text>

        <text className="text-[9px] font-bold fill-current">
          <textPath href="#stamp-curve-bottom" startOffset="50%" textAnchor="middle">
            DUBAI • OFFICIAL TAX SEAL • معتمد
          </textPath>
        </text>

        {/* Center Emblem */}
        <g transform="translate(100, 100)">
          {/* Central Star Crest */}
          <circle cx="0" cy="0" r="44" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
          <polygon
            points="0,-16 4,-5 16,-5 7,2 10,13 0,6 -10,13 -7,2 -16,-5 -4,-5"
            fill="currentColor"
            opacity="0.9"
            transform="scale(0.85) translate(0, -10)"
          />
          <text
            y="8"
            textAnchor="middle"
            className="text-[9px] font-black fill-current uppercase tracking-wider"
          >
            VERIFIED
          </text>
          <text
            y="20"
            textAnchor="middle"
            className="text-[7.5px] font-mono font-bold fill-current"
          >
            TRN-1002938491
          </text>
          <text
            y="30"
            textAnchor="middle"
            className="text-[7px] font-bold fill-current uppercase tracking-widest opacity-80"
          >
            FTA RATIFIED
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Authentic Corporate Calligraphic Vector Signature Fallback
 * Used when no custom signature is uploaded by the admin.
 */
function DefaultCalligraphicSignature() {
  return (
    <div className="relative w-44 h-14 select-none pointer-events-none transform -rotate-2">
      <svg
        viewBox="0 0 260 80"
        className="w-full h-full text-blue-900 fill-none stroke-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 15 55 C 30 25, 45 10, 60 30 C 75 50, 70 65, 85 45 C 95 30, 110 20, 125 35 C 135 45, 140 60, 160 38 C 175 22, 190 30, 205 32 C 215 34, 235 30, 245 28 M 40 48 Q 120 40 220 52 M 65 25 L 85 62 M 140 28 L 150 58"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function InvoiceStampSignature({
  stampUrl,
  signatureUrl,
  signatoryName = 'Eng. Tariq Al-Mansouri',
  signatoryTitle = 'Managing Director & Authorized Signatory',
  showStamp = true,
  showSignature = true,
  verificationDate,
  documentRef,
  companyTrn = '10029384910003',
  className = '',
  variant = 'full',
}: InvoiceStampSignatureProps) {
  // If both are explicitly turned off, don't render
  if (!showStamp && !showSignature) {
    return null;
  }

  const isCompact = variant === 'compact';

  const resolvedName = signatoryName || 'Eng. Tariq Al-Mansouri';
  const resolvedTitle = signatoryTitle || 'Managing Director & Authorized Signatory';

  return (
    <div
      className={`relative pt-4 pb-2 border-t border-slate-200 text-slate-900 print:text-slate-900 print:border-slate-300 print:break-inside-avoid ${isCompact ? 'scale-90 origin-right' : ''} ${className}`}
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
        {/* Left Side: Legal Notice & Digital Ratification Token */}
        <div className="space-y-1.5 text-left text-xs max-w-sm">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 print:text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 print:text-emerald-700 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Legally Sealed &amp; Authorized
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
            Issued under Federal Decree-Law No. (8) of 2017 on Value Added Tax. This document carries the official enterprise seal and signatory authorization.
          </p>
          <div className="text-[9px] font-mono text-slate-400 space-x-2 pt-0.5">
            <span>TRN: {companyTrn}</span>
            {documentRef && <span>• Ref: {documentRef}</span>}
            {verificationDate && <span>• Ratified: {verificationDate}</span>}
          </div>
        </div>

        {/* Right Side: Stamp & Signature Composite Block */}
        <div className="relative flex items-end justify-center sm:justify-end min-w-[280px]">
          {/* Stamp Layer (Positioned with slight overlap) */}
          {showStamp && (
            <div className="relative z-10 -mr-8 sm:-mr-10 mb-1 shrink-0">
              {stampUrl ? (
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 transition-transform hover:scale-105">
                  <Image
                    src={stampUrl}
                    alt="Official Corporate Stamp"
                    width={128}
                    height={128}
                    unoptimized
                    className="w-full h-full object-contain filter drop-shadow-sm select-none"
                  />
                </div>
              ) : (
                <DefaultCorporateStamp />
              )}
            </div>
          )}

          {/* Signature & Signatory Block */}
          {showSignature && (
            <div className="relative z-20 flex flex-col items-center sm:items-end text-right min-w-[190px]">
              {/* Signature Graphic */}
              <div className="h-16 flex items-center justify-center sm:justify-end mb-1">
                {signatureUrl ? (
                  <div className="relative w-40 h-16">
                    <Image
                      src={signatureUrl}
                      alt="Authorized Signature"
                      width={160}
                      height={64}
                      unoptimized
                      className="w-full h-full object-contain select-none filter contrast-125"
                    />
                  </div>
                ) : (
                  <DefaultCalligraphicSignature />
                )}
              </div>

              {/* Signature Line */}
              <div className="w-48 sm:w-56 h-[1.5px] bg-slate-900/80 print:bg-slate-900 mb-1.5" />

              {/* Signatory Credentials */}
              <div className="text-right space-y-0.5">
                <div className="text-xs font-black tracking-tight text-slate-900 print:text-slate-900 flex items-center justify-end gap-1">
                  <span>{resolvedName}</span>
                  <CheckCircle2 className="w-3 h-3 text-blue-600 print:text-blue-700" />
                </div>
                <div className="text-[10px] font-mono text-slate-600 print:text-slate-700 uppercase font-semibold">
                  {resolvedTitle}
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  NexTech Systems Enterprise LLC
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoiceStampSignature;
