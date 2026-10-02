'use client';

import { useState } from 'react';
import { Address } from '@/types';
import {
  MapPin,
  X,
  Check,
  Building,
  Phone,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => Promise<void>;
  initialAddress?: Address | null;
}

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

export function AddressManagementModal({
  isOpen,
  onClose,
  onSave,
  initialAddress,
}: AddressModalProps) {
  const [fullName, setFullName] = useState(initialAddress?.fullName || '');
  const [phone, setPhone] = useState(initialAddress?.phone || '+971 ');
  const [addressLine1, setAddressLine1] = useState(initialAddress?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(initialAddress?.addressLine2 || '');
  const [city, setCity] = useState(initialAddress?.city || 'Dubai');
  const [state, setState] = useState(initialAddress?.state || 'Dubai');
  const country = initialAddress?.country || 'United Arab Emirates';
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode || '');
  const [isDefaultShipping, setIsDefaultShipping] = useState(initialAddress?.isDefaultShipping ?? true);
  const [isDefaultBilling, setIsDefaultBilling] = useState(initialAddress?.isDefaultBilling ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Recipient full name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('A valid contact phone number is required for courier dispatch.');
      return;
    }
    if (!addressLine1.trim()) {
      setError('Street address / Building number is required.');
      return;
    }

    setSaving(true);
    try {
      const addressData: Address = {
        id: initialAddress?.id || `addr_${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim() || '00000',
        isDefaultShipping,
        isDefaultBilling,
      };

      await onSave(addressData);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save delivery address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-tech-blue dark:text-tech-cyan">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {initialAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official GCC Logistics & Dispatch Address
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Recipient Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Rashid Al-Maktoum"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Contact Phone (Courier SMS & OTP) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Building, Street & Office / Villa *
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="e.g. Level 42, Al Saada Tower, DIFC"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors"
              />
            </div>
          </div>

          {/* Address Line 2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Additional Details / Landmark (Optional)
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={e => setAddressLine2(e.target.value)}
              placeholder="e.g. Near Gate Precinct 4, Makani 12345 67890"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors"
            />
          </div>

          {/* City / Emirate & Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Emirate / City *
              </label>
              <select
                value={city}
                onChange={e => {
                  setCity(e.target.value);
                  setState(e.target.value);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue transition-colors"
              >
                {UAE_EMIRATES.map(em => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Postal Code / Makani Number
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="e.g. 00000 or Makani ID"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue"
              />
            </div>
          </div>

          {/* Default checkboxes */}
          <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefaultShipping}
                onChange={e => setIsDefaultShipping(e.target.checked)}
                className="w-4 h-4 rounded text-tech-blue focus:ring-tech-blue border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Set as default delivery address for all hardware purchases
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefaultBilling}
                onChange={e => setIsDefaultBilling(e.target.checked)}
                className="w-4 h-4 rounded text-tech-blue focus:ring-tech-blue border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Set as default billing address on FTA Tax Invoices
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-tech-blue hover:bg-blue-600 text-white transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Address...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Delivery Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
