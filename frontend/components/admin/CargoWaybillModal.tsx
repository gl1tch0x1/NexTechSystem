'use client';

import React, { useState } from 'react';
import { Order, CargoDetails } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { getDerivedCargoDetails } from '@/lib/cargo-utils';
import {
  X,
  Truck,
  Printer,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Save,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { printDocumentElement } from '@/lib/print-document';

interface CargoWaybillModalProps {
  order: Order;
  onClose: () => void;
  onUpdateCargo: (orderId: string, cargoDetails: CargoDetails) => Promise<void>;
}

export default function CargoWaybillModal({ order, onClose, onUpdateCargo }: CargoWaybillModalProps) {
  const initialCargo = getDerivedCargoDetails(order);
  const [cargo, setCargo] = useState<CargoDetails>(initialCargo);
  const [carrier, setCarrier] = useState(initialCargo.carrier || 'DHL Express');
  const [trackingNumber, setTrackingNumber] = useState(initialCargo.trackingNumber || initialCargo.waybillNumber || '');
  const [driverName, setDriverName] = useState(initialCargo.driverName || '');
  const [driverPhone, setDriverPhone] = useState(initialCargo.driverPhone || '');
  const [vehiclePlate, setVehiclePlate] = useState(initialCargo.vehiclePlate || '');
  const [customsBoe, setCustomsBoe] = useState(initialCargo.customsDeclarationNumber || '');
  const [weightKg, setWeightKg] = useState(String(initialCargo.weightKg || ''));
  const [packageCount, setPackageCount] = useState(String(initialCargo.packageCount || '1'));
  const [dimensions, setDimensions] = useState(initialCargo.dimensions || '');
  const [notes, setNotes] = useState(initialCargo.notes || '');

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopyAwb = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatedCargo: CargoDetails = {
        ...cargo,
        carrier,
        trackingNumber,
        waybillNumber: trackingNumber,
        driverName,
        driverPhone,
        vehiclePlate,
        customsDeclarationNumber: customsBoe,
        weightKg: parseFloat(weightKg) || cargo.weightKg,
        packageCount: parseInt(packageCount, 10) || cargo.packageCount,
        dimensions,
        notes,
      };
      await onUpdateCargo(order.id, updatedCargo);
      setCargo(updatedCargo);
      setFeedback({ type: 'success', message: 'Cargo dispatch manifest and tracking saved successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update cargo details' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    printDocumentElement('printable-cargo-waybill', `Cargo_Manifest_${cargo.waybillNumber || order.orderNumber}`);
  };

  return (
    <div
      data-printable-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:static print:inset-auto print:block print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full print:h-auto"
    >
      <div
        data-printable-card="true"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto print:static print:w-full print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible print:max-h-none print:h-auto print:bg-white print:block"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 shrink-0 print:hidden no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Air Cargo Waybill & Freight Manifest
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {cargo.carrier}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Consignment Ref: <span className="text-slate-900 dark:text-white font-bold">{order.orderNumber}</span> • AWB: <span className="text-blue-600 dark:text-cyan-400 font-bold">{cargo.waybillNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print Official Air Waybill Tag"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Print AWB Tag</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div id="printable-cargo-waybill" className="printable-content p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 print:p-0 print:overflow-visible">
          {/* Printable AWB Visual Barcode Header */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 relative overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  Global Freight Tracking Code
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-wider flex items-center gap-2 mt-0.5">
                  <span>{cargo.waybillNumber}</span>
                  <button
                    onClick={handleCopyAwb}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copy AWB to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span className="font-semibold">{cargo.cargoType}</span>
                  <span>•</span>
                  <span>{cargo.weightKg} kg ({cargo.packageCount} {cargo.packageCount === 1 ? 'Box' : 'Boxes/Pallets'})</span>
                </div>
              </div>

              {/* Barcode SVG Rendering */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-[3px] h-10 px-2">
                  {[4,2,6,1,3,5,2,4,1,6,3,2,5,1,4,2,6,2,3,5,1,4,3,2,6,1,4,2,5,3,1,4,2,6].map((w, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 dark:bg-white h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 tracking-widest">
                  *{cargo.waybillNumber}*
                </div>
              </div>
            </div>
          </div>

          {/* Consignor (Shipper) & Consignee (Receiver) 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipper */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Shipper (Consignor)</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                NexTech Systems FZ-LLC
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Central Logistics Terminal, DWC Logistics City
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Dubai South, United Arab Emirates
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                TRN / VAT: <strong>100492819200003</strong> • Tel: +971 4 800-NEXTECH
              </div>
            </div>

            {/* Consignee */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Consignee (Destination)</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{order.companyName || order.customerName}</span>
                {order.customerType === 'BUSINESS' && (
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                    B2B
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {order.shippingAddress?.addressLine1}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {order.shippingAddress?.city}, {order.shippingAddress?.country || 'AE'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                Contact: {order.customerName} • {order.customerPhone || 'No Phone'} • {order.customerEmail}
              </div>
            </div>
          </div>

          {/* Flight / Transit Hub & Customs Specification Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Origin Port / Hub</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{cargo.originHub}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Destination Hub</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{cargo.destinationHub}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Customs Declaration</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate">
                {cargo.customsDeclarationNumber || 'BOE-AE-CLEARED'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Estimated SLA Date</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                {cargo.estimatedDeliveryDate || 'Within 48h'}
              </div>
            </div>
          </div>

          {/* Hardware Cargo Line Items Manifest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span>Cargo Contents Manifest ({order.items?.length || 0} Line Items)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Declared Value: <strong className="text-slate-900 dark:text-white">{formatPrice(order.total)}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Serial Numbers</th>
                    <th className="py-2.5 px-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {item.sku || 'SKU-NXT'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        {item.serialNumbers && item.serialNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.serialNumbers.map((sn, sIdx) => (
                              <span key={sIdx} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pre-manifest serial scan</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Milestone Timeline Progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Cargo Dispatch Milestones</span>
            </h3>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {cargo.milestones?.map((m, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        m.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {m.completed && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{m.stage}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {formatDate(m.timestamp)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.location}</span>
                        {m.notes && <span className="text-slate-400">• {m.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Cargo Dispatch Details Editor Form */}
          <form onSubmit={handleSave} className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Update Cargo Tracking & Logistics Details</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Changes made here update the order's live tracking and customer dispatch view.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Cargo Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Freight Carrier
                </label>
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="DHL Express">DHL Express (Global Priority)</option>
                  <option value="Aramex GCC Global">Aramex GCC Global</option>
                  <option value="FedEx Freight">FedEx Priority Freight</option>
                  <option value="Emirates SkyCargo">Emirates SkyCargo</option>
                  <option value="NexTech Direct Logistics">NexTech Direct Fleet (Local GCC)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Air Waybill (AWB) / Tracking #
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="AWB-DXB-XXXXX"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customs BOE Number
                </label>
                <input
                  type="text"
                  value={customsBoe}
                  onChange={e => setCustomsBoe(e.target.value)}
                  placeholder="BOE-AE-2026-XXXX"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gross Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Package / Pallet Count
                </label>
                <input
                  type="number"
                  value={packageCount}
                  onChange={e => setPackageCount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Carton Dimensions (cm)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={e => setDimensions(e.target.value)}
                  placeholder="50 x 38 x 28 cm"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Courier / Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Driver Full Name"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Contact Number
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={e => setDriverPhone(e.target.value)}
                  placeholder="+971 50 XXX XXXX"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Registration Plate
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={e => setVehiclePlate(e.target.value)}
                  placeholder="DXB-Z-49210"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cargo Special Handling Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special handling instructions, gate pass requirements, ESD protection..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
