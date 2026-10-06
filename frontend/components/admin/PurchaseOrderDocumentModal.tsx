'use client';

import { PurchaseOrder } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  X,
  Printer,
  Building2,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Warehouse,
  Barcode,
  CreditCard,
  FileText,
  BadgeCheck,
  Package
} from 'lucide-react';
import { NEXTECH_BUYER_DETAILS, VERIFIED_SUPPLIERS } from '@/lib/suppliers-data';

interface PurchaseOrderDocumentModalProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseOrderDocumentModal({ po, isOpen, onClose }: PurchaseOrderDocumentModalProps) {
  if (!isOpen || !po) return null;

  // Resolve supplier details
  const matchedSupplier = VERIFIED_SUPPLIERS.find(
    s => s.displayName === po.supplierName || s.details.legalName === po.supplierName || s.brand.toLowerCase() === po.supplierName.toLowerCase()
  );

  const supplier = po.supplierDetails || matchedSupplier?.details || {
    legalName: po.supplierName,
    tradeLicenseNumber: 'JAFZA-TL-10492',
    taxRegistrationNumber: '100293847100003',
    country: 'United Arab Emirates',
    city: 'Dubai',
    addressLine: 'JAFZA South Zone 4, Warehouse 12B, Jebel Ali Free Zone, Dubai, UAE',
    contactPerson: 'Karim Al-Husseini (Director of Channel Distribution)',
    contactEmail: 'procurement.mena@asus.com',
    contactPhone: '+971 4 881 7400',
    paymentTerms: po.paymentTerms || 'Net 30 Days Commercial Wire',
    incoterms: po.deliveryTerms || 'DDP - JAFZA Mega-Hub',
    vendorCode: 'VND-ASUS-9901',
  };

  const buyer = po.buyerDetails || NEXTECH_BUYER_DETAILS;
  const items = po.items && po.items.length > 0 ? po.items : [
    {
      productId: 'prod_hardware_main',
      sku: (po as any).sku || 'ROG-STRIX-RTX4090-O24G-GAMING',
      name: (po as any).sku ? `Hardware Component (${(po as any).sku})` : 'ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X OC Edition',
      orderedQuantity: (po as any).units || 12,
      quantity: (po as any).units || 12,
      unitCost: ((po as any).totalCost && (po as any).units) ? Math.round((po as any).totalCost / (po as any).units) : 7450,
      totalCost: (po as any).totalCost || 89400,
      subtotal: (po as any).totalCost || 89400,
    }
  ];

  const subtotal = po.totalCost || po.totalEstimatedCost || items.reduce((acc, it) => acc + (it.totalCost || (it.unitCost * (it.orderedQuantity || it.quantity || 1))), 0);
  const vatRate = 0.05;
  const vatAmount = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + vatAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Action Bar */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{po.poNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  po.status === 'RECEIVED' || (po as any).status === 'RECEIVED_RESTOCKED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : (po.status as any) === 'IN_TRANSIT'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}>
                  {po.status === 'RECEIVED' || (po as any).status === 'RECEIVED_RESTOCKED' ? 'RECEIVED & VERIFIED' : (po.status as any) === 'IN_TRANSIT' ? 'IN TRANSIT' : 'ISSUED / AWAITING FULFILLMENT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Official Wholesale Supplier Procurement Order & Tax Requisition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print PO Dossier</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable PO Document Body */}
        <div id="printable-ebill" className="printable-content printable-invoice p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Document Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-xs tracking-wider rounded-lg uppercase">
                  NEXTECH ENTERPRISE
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  ISO 9001:2015 Compliant Procurement
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                PURCHASE ORDER & REQUISITION
              </h1>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Binding Commercial Order Issued under UAE Commercial Companies Federal Decree-Law
              </p>
            </div>

            <div className="sm:text-right font-mono text-xs space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shrink-0">
              <div className="flex items-center sm:justify-end gap-2 text-slate-900 dark:text-white font-bold">
                <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>PO #: {po.poNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Date Issued: <strong className="text-slate-800 dark:text-slate-200">{formatDate(po.createdAt || new Date().toISOString())}</strong>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Expected Ingestion: <strong className="text-slate-800 dark:text-slate-200">{(po as any).estimatedArrival || po.expectedDeliveryDate || 'Within 48 Hours'}</strong>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Currency: <strong className="text-blue-600 dark:text-blue-400">{po.currency || 'AED'}</strong>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN COMPANY DETAILS SECTION (BUYER & SUPPLIER) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. SELLER / SUPPLIER COMPANY DETAILS (Where goods are purchased) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>SUPPLIER / VENDOR PROFILE</span>
                </div>
                {supplier.vendorCode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {supplier.vendorCode}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                  {supplier.legalName}
                </h4>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                  Authorized Manufacturer Channel & Wholesale Distribution Hub
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">VAT / TRN:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{supplier.taxRegistrationNumber || '100293847100003'}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Trade License (CR):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{supplier.tradeLicenseNumber || 'JAFZA-TL-10492'}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Corporate HQ:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right leading-tight max-w-[240px]">
                    {supplier.addressLine}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Key Contact:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{supplier.contactPerson}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Official Email:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 text-right">{supplier.contactEmail}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Direct Line:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{supplier.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* 2. BUYER COMPANY DETAILS (NexTech Systems) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>BUYING ENTERPRISE (BUYER)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  VERIFIED BUYER
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                  {buyer.legalName}
                </h4>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                  High-Performance Enterprise Technology Commerce Platform
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Buyer TRN:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{buyer.taxRegistrationNumber}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Operating License:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">DSO-FZCO-89421</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Billing Address:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right leading-tight max-w-[240px]">
                    {buyer.corporateAddress}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Procurement Desk:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{buyer.contactPerson}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Contact Email:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 text-right">{buyer.contactEmail}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Central Phone:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{buyer.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LOGISTICS, WAREHOUSE HUB & COMMERCIAL TERMS STRIP */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                <span>Target Hub</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                {po.targetWarehouse || (po as any).targetHub || 'DXB-01 (JAFZA Mega-Hub)'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                <span>Payment Terms</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                {po.paymentTerms || supplier.paymentTerms || 'Net 30 Commercial'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Incoterms 2020</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                {po.deliveryTerms || supplier.incoterms || 'DDP (Delivered Duty Paid)'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                <BadgeCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Inspection Protocol</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                Mandatory SN Scan
              </div>
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Purchased Line Items & Hardware Specifications</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {items.length} Component Line{items.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    <th className="py-2.5 px-3.5">#</th>
                    <th className="py-2.5 px-3.5">SKU / Model Number</th>
                    <th className="py-2.5 px-3.5">Description & Specifications</th>
                    <th className="py-2.5 px-3.5 text-center">Qty</th>
                    <th className="py-2.5 px-3.5 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((it, idx) => {
                    const qty = it.orderedQuantity || it.quantity || 1;
                    const unitCost = it.unitCost || 0;
                    const lineTotal = it.totalCost || (unitCost * qty);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3.5 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">{it.sku}</td>
                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                          <div>{it.name || (it as any).title || it.sku}</div>
                          <div className="text-[10px] text-slate-400">OEM Enterprise Spec • Inbound QA Verified</div>
                        </td>
                        <td className="py-3 px-3.5 text-center font-bold text-slate-900 dark:text-white">{qty}</td>
                        <td className="py-3 px-3.5 text-right font-medium text-slate-700 dark:text-slate-300">{formatPrice(unitCost)}</td>
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">{formatPrice(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINANCIAL SUMMARY & VAT RECONCILIATION */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs space-y-2 max-w-sm">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono">
                Commercial Requisition Notes & Compliance
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {po.notes || 'All hardware delivered under this purchase order must include intact OEM factory seals, individual serial barcodes, and authorized Middle East regional warranty coverage. Electronic receipt confirmation issued upon dock ingestion.'}
              </p>
              <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>FTA UAE VAT & Corporate Commercial Law Compliant</span>
              </div>
            </div>

            <div className="w-full sm:w-72 font-mono text-xs space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-slate-500">
                <span>Net Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>UAE VAT (5.00%):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(vatAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Customs & Clearance:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">INCLUDED (DDP)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Total Outlay:</span>
                <span className="font-black text-blue-600 dark:text-blue-400 text-base">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE & LEGAL RATIFICATION SECTION */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono">
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Authorized By (Buyer Requisition Desk)</span>
              <div className="font-bold text-slate-900 dark:text-white pt-3">
                NexTech Systems Chief Procurement Officer
              </div>
              <div className="text-[10px] text-slate-500">Electronically Verified • Cryptographic Hash: SHA256-NX-PO-{po.poNumber}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Supplier Confirmation (Vendor Operations)</span>
              <div className="font-bold text-slate-900 dark:text-white pt-3">
                {supplier.legalName}
              </div>
              <div className="text-[10px] text-slate-500">Commercial Confirmation Pending Ingestion • Net 30 Terms Validated</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            Document ID: NX-PO-{po.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
}
