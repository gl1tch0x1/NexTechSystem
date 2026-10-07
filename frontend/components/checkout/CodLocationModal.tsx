'use client';

import React, { useState, useEffect } from 'react';
import { Address } from '@/types';
import {
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building,
  Phone,
  User,
  X,
  Compass,
  Sparkles
} from 'lucide-react';

interface CodLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedAddress: Address) => void;
  initialAddress: Address;
  isBurDubaiChecker: (address?: Address | null) => boolean;
}

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain'
];

export default function CodLocationModal({
  isOpen,
  onClose,
  onConfirm,
  initialAddress,
  isBurDubaiChecker,
}: CodLocationModalProps) {
  const [address, setAddress] = useState<Address>(initialAddress);
  const [landmarkNote, setLandmarkNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAddress({ ...initialAddress });
      setValidationError('');
    }
  }, [isOpen, initialAddress]);

  if (!isOpen) return null;

  const isBurDubai = isBurDubaiChecker(address);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName?.trim()) {
      setValidationError('Consignee / Full Name is required.');
      return;
    }
    if (!address.phone?.trim()) {
      setValidationError('A valid contact phone number is required for courier coordination.');
      return;
    }
    if (!address.addressLine1?.trim()) {
      setValidationError('Street address, building name, or villa number is required.');
      return;
    }

    const fullAddress: Address = {
      ...address,
      addressLine2: landmarkNote.trim() ? `Landmark: ${landmarkNote.trim()}` : address.addressLine2,
    };

    onConfirm(fullAddress);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-100 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/5">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Confirm Cash on Delivery Location
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ensure first-attempt courier handover with precise location coordinates
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Location Verification & Bur Dubai Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
              isBurDubai
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl shrink-0 ${isBurDubai ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed">
              {isBurDubai ? (
                <div>
                  <div className="font-extrabold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bur Dubai Destination Detected — FREE COD Handling</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 mt-0.5">
                    Your location qualifies for zero Cash on Delivery service fee (AED 0.00).
                  </p>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Standard UAE Courier Delivery — AED 25.00 Handling Fee
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Deliveries inside Bur Dubai (Al Karama, Al Mankhool, Al Fahidi, Meena Bazaar, etc.) are FREE.
                  </p>
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            {/* Consignee Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Consignee Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={e => setAddress({ ...address, fullName: e.target.value })}
                  placeholder="Recipient full name"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Courier Contact Phone *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={e => setAddress({ ...address, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Building / Villa / Office &amp; Street Address *</span>
              </label>
              <input
                type="text"
                required
                value={address.addressLine1}
                onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                placeholder="e.g. Al Fahidi St, Flat 402, Meena Bazaar Building, Bur Dubai"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Nearest Landmark & Area */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Nearest Landmark or Area (Recommended for Delivery Driver)</span>
              </label>
              <input
                type="text"
                value={landmarkNote}
                onChange={e => setLandmarkNote(e.target.value)}
                placeholder="e.g. Near Al Fahidi Metro Station / Behind Burjuman Mall"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Emirate & City Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emirate / State *
                </label>
                <select
                  value={address.state || address.city || 'Dubai'}
                  onChange={e => setAddress({ ...address, state: e.target.value, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium cursor-pointer"
                >
                  {UAE_EMIRATES.map(emirate => (
                    <option key={emirate} value={emirate}>
                      {emirate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={e => setAddress({ ...address, city: e.target.value })}
                  placeholder="e.g. Dubai / Bur Dubai"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Delivery Location for COD</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
