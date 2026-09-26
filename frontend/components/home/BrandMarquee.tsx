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

function isUnsplashPhotoUrl(urlString?: string): boolean {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString, 'http://localhost');
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'unsplash.com' || hostname.endsWith('.unsplash.com');
  } catch {
    return false;
  }
}

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
        const isLegacyPlaceholder = isUnsplashPhotoUrl(b.logo);
        const resolvedLogo = (!isLegacyPlaceholder && b.logo) ? b.logo : (matchingPreset?.logo || b.logo || '/brands/intel.svg');

        return {
          name: b.name,
          code: b.slug ? b.slug.toUpperCase().replace(/^BRAND_/, '') : b.name.slice(0, 4).toUpperCase(),
          search: b.name,
          role: b.description || matchingPreset?.role || 'Authorized GCC Supply Partner',
          logo: resolvedLogo,
          badge: b.tier === 'TIER_1' ? 'Tier-1 Direct' : b.tier === 'TIER_2' ? 'Certified' : 'Official Partner',
        };
      });
    }
    return TIER1_HARDWARE_PARTNERS;
  }, [brands]);

  return (
    <section className="py-6 sm:py-7 border-y border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070B14]/90 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan shrink-0" />
            <span>Tier-1 Authorized GCC Hardware Supply Chain</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[10.5px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Direct Manufacturer Warranty
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-tech-blue dark:text-tech-cyan shrink-0" /> 100% Verified Sealed Stock
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/products"
              className="hidden lg:flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-tech-cyan font-semibold transition-colors"
            >
              <span>All Brands</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Infinite Marquee Track with Edge Gradients */}
      <div className="relative w-full overflow-hidden marquee-container">
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10 bg-gradient-to-r from-slate-50/90 dark:from-[#070B14] to-transparent" />

        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10 bg-gradient-to-l from-slate-50/90 dark:from-[#070B14] to-transparent" />

        {/* Continuous Smooth Scrolling Marquee Container */}
        <div className="flex items-center animate-marquee gap-4 sm:gap-5 select-none py-1.5">
          {/* Double mapped array for seamless infinite loop */}
          {[...displayPartners, ...displayPartners].map((partner, idx) => (
            <Link
              key={`${partner.code}-${idx}`}
              href={`/products?search=${encodeURIComponent(partner.search)}`}
              className="group flex items-center gap-3.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-cyan-500/80 hover:shadow-lg transition-all shrink-0 select-none min-w-[260px] sm:min-w-[300px]"
            >
              {/* Brand Logo Box with Crisp, Prominent Proportions */}
              <div className="h-14 sm:h-16 w-24 sm:w-28 px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-center shrink-0 group-hover:scale-104 transition-transform shadow-xs">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-10 sm:max-h-11 max-w-full object-contain filter dark:brightness-110 contrast-125"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Brand Metadata */}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                    {partner.name.split(' ')[0]}
                  </span>
                  {partner.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-tech-blue dark:text-tech-cyan border border-blue-200/60 dark:border-blue-800/50 hidden xs:inline-block shrink-0">
                      {partner.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono mt-1">
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
