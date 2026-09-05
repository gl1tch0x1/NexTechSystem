'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react';
import { Brand } from '@/types';

interface BrandMarqueeProps {
  brands?: Brand[];
}

const DEFAULT_OEM_PARTNERS = [
  { name: 'Intel Corporation', code: 'INTEL', role: 'Xeon & Core Direct', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282020%29.svg' },
  { name: 'NVIDIA Enterprise', code: 'NVDA', role: 'Ada & Hopper Compute', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg' },
  { name: 'ASUS Republic of Gamers', code: 'ASUS', role: 'Motherboards & GPUs', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg' },
  { name: 'Dell Technologies', code: 'DELL', role: 'PowerEdge Server OEM', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg' },
  { name: 'Cisco Systems', code: 'CSCO', role: 'Catalyst & Nexus Switching', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg' },
  { name: 'Samsung Semiconductor', code: 'SMSN', role: 'Enterprise NVMe Storage', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
  { name: 'Kingston Technology', code: 'KNGS', role: 'ECC Registered Memory', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Kingston_Technology_logo.svg' },
  { name: 'Seasonic Power', code: 'SSNC', role: 'Titanium PSU Architect', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Seasonic_logo.svg' },
];

export function BrandMarquee({ brands }: BrandMarqueeProps) {
  const displayPartners = brands && brands.length > 0 ? brands : DEFAULT_OEM_PARTNERS;

  return (
    <section className="py-6 border-y border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070B14]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Tier-1 Authorized GCC Hardware Supply Chain</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Direct Manufacturer Warranty
            </span>
            <span className="hidden sm:inline-block">•</span>
            <span className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-tech-blue" /> 100% Verified Sealed Stock
            </span>
          </div>
        </div>

        {/* Brand Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-4">
          {DEFAULT_OEM_PARTNERS.map((partner, idx) => (
            <Link
              key={idx}
              href={`/products?search=${encodeURIComponent(partner.name.split(' ')[0])}`}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue dark:hover:border-tech-cyan hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
            >
              <div className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-tech-blue dark:group-hover:text-tech-cyan transition-colors truncate w-full">
                {partner.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full font-mono mt-0.5">
                {partner.role}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
