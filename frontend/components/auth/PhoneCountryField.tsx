'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Phone, Search } from 'lucide-react';

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
}

/** Render a real country flag SVG image from flagcdn with clean fallback */
export function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const lower = code.toLowerCase();
  const height = Math.round(size * 0.7);

  if (hasError) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-[2px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-mono font-bold leading-none shrink-0"
        style={{ width: `${size}px`, height: `${height}px` }}
      >
        {code}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-[2px] overflow-hidden border border-slate-300/60 dark:border-slate-600/60 shrink-0 shadow-xs"
      style={{ width: `${size}px`, height: `${height}px` }}
    >
      <img
        src={`https://flagcdn.com/${lower}.svg`}
        width={size}
        height={height}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </span>
  );
}

export const COUNTRY_CODES: CountryCode[] = [
  // Gulf & Middle East
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964' },
  { code: 'SY', name: 'Syria', dialCode: '+963' },
  { code: 'YE', name: 'Yemen', dialCode: '+967' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  // North America
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  // South Asia
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  // East & Southeast Asia
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  // Africa
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  // South America
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
];

export function formatInternationalPhone(value: string, country: CountryCode): string {
  const trimmed = value.trim();
  return trimmed.startsWith('+') ? trimmed : `${country.dialCode} ${trimmed.replace(/^0+/, '')}`;
}

interface PhoneCountryFieldProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  placeholder?: string;
  accent?: 'blue' | 'amber';
}

export function PhoneCountryField({
  id, label, value, onValueChange, country, onCountryChange,
  placeholder = '50 123 4567', accent = 'blue',
}: PhoneCountryFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <div className={`relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-tech-slate transition-colors ${accent === 'amber' ? 'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20' : 'focus-within:border-tech-blue'}`}>
      <div ref={dropdownRef} className="relative shrink-0">
        <button type="button" id={`${id}-country-selector`}
          onClick={() => { setOpen(previous => !previous); setSearch(''); }}
          className="flex items-center gap-1.5 rounded-l-xl py-3 pl-3 pr-2 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          title={`${country.name} (${country.dialCode})`}
          aria-label={`Select country code for ${label}`}
          aria-expanded={open}
          aria-controls={`${id}-country-options`}
        >
          <CountryFlag code={country.code} size={20} />
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{country.dialCode}</span>
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div id={`${id}-country-options`} className="absolute left-0 top-full z-[200] mt-2 flex w-72 max-w-[85vw] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101D] shadow-2xl">
            <div className="relative border-b border-slate-100 dark:border-slate-800 p-2">
              <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input type="search" value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Search country or code..." aria-label="Search country codes"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-56 space-y-0.5 overflow-y-auto p-1.5">
              {filtered.map(item => (
                <button key={item.code} type="button"
                  onClick={() => { onCountryChange(item); setOpen(false); setSearch(''); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${country.code === item.code ? `${accent === 'amber' ? 'bg-amber-500' : 'bg-tech-blue'} font-bold text-white` : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'}`}
                >
                  <CountryFlag code={item.code} size={20} />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="shrink-0 font-mono">{item.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="py-5 text-center text-xs text-slate-400">No countries found</p>}
            </div>
          </div>
        )}
      </div>
      <div className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
      <input id={id} type="tel" autoComplete="tel" aria-label={label}
        value={value} onChange={event => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
      />
      <Phone className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
    </div>
  );
}
