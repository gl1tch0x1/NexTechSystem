'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { Brand } from '@/types';

interface BrandMarqueeProps {
  brands?: Brand[];
}

export interface OEMPartner {
  name: string;
  code: string;
  search: string;
  role: string;
  logo: string;
  badge?: string;
}

const TIER1_HARDWARE_PARTNERS: OEMPartner[] = [
  {
    name: 'Intel Corporation',
    code: 'INTEL',
    search: 'Intel',
    role: 'Xeon Scalable & Core Ultra',
    logo: '/brands/intel.svg',
    badge: 'Tier-1 Direct',
  },
  {
    name: 'NVIDIA Enterprise',
    code: 'NVDA',
    search: 'NVIDIA',
    role: 'Ada Lovelace & Hopper AI',
    logo: '/brands/nvidia.svg',
    badge: 'Elite Partner',
  },
  {
    name: 'AMD',
    code: 'AMD',
    search: 'AMD',
    role: 'EPYC Server & Ryzen Direct',
    logo: '/brands/amd.svg',
    badge: 'Authorized',
  },
  {
    name: 'ASUS Republic of Gamers',
    code: 'ASUS',
    search: 'ASUS',
    role: 'ROG & ProArt Workstation',
    logo: '/brands/asus.svg',
    badge: 'Official Distributor',
  },
  {
    name: 'Dell Technologies',
    code: 'DELL',
    search: 'Dell',
    role: 'PowerEdge Server Infrastructure',
    logo: '/brands/dell.svg',
    badge: 'Titanium OEM',
  },
  {
    name: 'HP Enterprise',
    code: 'HPE',
    search: 'HP',
    role: 'ProLiant & Apollo Compute',
    logo: '/brands/hpe.svg',
    badge: 'Platinum Direct',
  },
  {
    name: 'Lenovo',
    code: 'LNV',
    search: 'Lenovo',
    role: 'ThinkSystem & Workstations',
    logo: '/brands/lenovo.svg',
    badge: 'Premier Partner',
  },
  {
    name: 'Cisco Systems',
    code: 'CSCO',
    search: 'Cisco',
    role: 'Catalyst & Nexus Switching',
    logo: '/brands/cisco.svg',
    badge: 'Gold Integrator',
  },
  {
    name: 'Supermicro',
    code: 'SPMC',
    search: 'Supermicro',
    role: 'AI SuperServer Systems',
    logo: '/brands/supermicro.svg',
    badge: 'Direct System Integrator',
  },
  {
    name: 'Samsung Semiconductor',
    code: 'SMSN',
    search: 'Samsung',
    role: 'Enterprise NVMe Gen5 SSDs',
    logo: '/brands/samsung.svg',
    badge: 'OEM Direct',
  },
  {
    name: 'Kingston Technology',
    code: 'KNGS',
    search: 'Kingston',
    role: 'Server Premier DDR5 ECC',
    logo: '/brands/kingston.svg',
    badge: 'Official Partner',
  },
  {
    name: 'Corsair Memory',
    code: 'COR',
    search: 'Corsair',
    role: 'Dominator DDR5 & Enclosures',
    logo: '/brands/corsair.svg',
    badge: 'Tier-1 Direct',
  },
  {
    name: 'Seasonic Power',
    code: 'SSNC',
    search: 'Seasonic',
    role: 'PRIME Titanium PSU Architect',
    logo: '/brands/seasonic.svg',
    badge: 'Master Distributor',
  },
  {
    name: 'Western Digital',
    code: 'WD',
    search: 'Western Digital',
    role: 'Ultrastar Data Center Drives',
    logo: '/brands/wd.svg',
    badge: 'Enterprise Authorized',
  },
  {
    name: 'Seagate Technology',
    code: 'STX',
    search: 'Seagate',
    role: 'Exos Enterprise & IronWolf Pro',
    logo: '/brands/seagate.svg',
    badge: 'Tier-1 Authorized',
  },
  {
    name: 'Gigabyte Technology',
    code: 'GIGA',
    search: 'Gigabyte',
    role: 'AORUS & HPC Server Boards',
    logo: '/brands/gigabyte.svg',
    badge: 'Authorized GCC',
  },
  {
    name: 'MSI Enterprise',
    code: 'MSI',
    search: 'MSI',
    role: 'MEG & Creator Workstations',
    logo: '/brands/msi.svg',
    badge: 'Direct OEM',
  },
  {
    name: 'Synology',
    code: 'SYN',
    search: 'Synology',
    role: 'Enterprise NAS & SAN Array',
    logo: '/brands/synology.svg',
    badge: 'Certified Solution',
  },
  {
    name: 'Fortinet',
    code: 'FTNT',
    search: 'Fortinet',
    role: 'FortiGate Network Security',
    logo: '/brands/fortinet.svg',
    badge: 'Hardware Alliance',
  },
  {
    name: 'Crucial by Micron',
    code: 'MCRN',
    search: 'Crucial',
    role: 'Pro Overclocking & Server DRAM',
    logo: '/brands/crucial.svg',
    badge: 'Direct Tier-1',
  },
];

export function BrandMarquee({ brands }: BrandMarqueeProps) {
  // Dynamic brands from database/admin API with fallback to 20 Tier-1 presets
  const displayPartners = React.useMemo(() => {
    if (brands && brands.length > 0) {
      return brands.map((b) => {
        const matchingPreset = TIER1_HARDWARE_PARTNERS.find(
          (p) =>
            p.name.toLowerCase().includes(b.name.toLowerCase()) ||
            b.name.toLowerCase().includes(p.search.toLowerCase()) ||
            (b.slug && p.code.toLowerCase() === b.slug.toLowerCase().replace(/^brand_/, ''))
        );
        return {
          name: b.name,
          code: b.slug ? b.slug.toUpperCase().replace(/^BRAND_/, '') : b.name.slice(0, 4).toUpperCase(),
          search: b.name,
          role: b.description || matchingPreset?.role || 'Authorized GCC Supply Partner',
          logo: b.logo || matchingPreset?.logo || '/brands/intel.svg',
          badge: b.tier === 'TIER_1' ? 'Tier-1 Direct' : b.tier === 'TIER_2' ? 'Certified' : 'Official Partner',
        };
      });
    }
    return TIER1_HARDWARE_PARTNERS;
  }, [brands]);

  return (
    <section className="py-6 border-y border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070B14]/90 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">
            <Award className="w-4 h-4 text-tech-blue dark:text-tech-cyan shrink-0" />
            <span>Tier-1 Authorized GCC Hardware Supply Chain</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Direct Manufacturer Warranty
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan shrink-0" /> 100% Verified Sealed Stock
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/products"
              className="hidden lg:flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-tech-cyan transition-colors"
            >
              <span>View All Brands</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Infinite Marquee Track with Edge Gradients */}
      <div className="relative w-full overflow-hidden marquee-container">
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-r from-slate-50/90 dark:from-[#070B14] to-transparent" />

        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 z-10 bg-gradient-to-l from-slate-50/90 dark:from-[#070B14] to-transparent" />

        {/* Continuous Smooth Scrolling Marquee Container */}
        <div className="flex items-center animate-marquee gap-3 sm:gap-4 select-none py-1">
          {/* Double mapped array for seamless infinite loop */}
          {[...displayPartners, ...displayPartners].map((partner, idx) => (
            <Link
              key={`${partner.code}-${idx}`}
              href={`/products?search=${encodeURIComponent(partner.search)}`}
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue/80 dark:hover:border-tech-cyan/80 hover:shadow-md dark:hover:shadow-tech-cyan/5 transition-all shrink-0 select-none min-w-[240px] sm:min-w-[260px]"
            >
              {/* Brand Logo Box with Image */}
              <div className="h-9 w-20 sm:w-24 px-2 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-6 max-w-full object-contain filter dark:brightness-110 contrast-125"
                  loading="lazy"
                />
              </div>

              {/* Brand Metadata */}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-tech-blue dark:group-hover:text-tech-cyan transition-colors truncate">
                    {partner.name.split(' ')[0]}
                  </span>
                  {partner.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-tech-blue dark:text-tech-cyan border border-blue-200/60 dark:border-blue-800/50 hidden xs:inline-block shrink-0">
                      {partner.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                  {partner.role}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
