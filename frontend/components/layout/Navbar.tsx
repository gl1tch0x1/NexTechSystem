'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DirhamSymbol } from '@/components/ui/DirhamSymbol';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Layers,
  Store,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Flame,
  LogOut,
  PackageCheck,
  LayoutDashboard,
  Truck,
  Settings,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { NextechLogo } from '@/components/ui/NextechLogo';
import { TopAnnouncementBar } from '@/components/layout/TopAnnouncementBar';

interface SubmenuLink {
  title: string;
  description?: string;
  href: string;
  badge?: string;
  badgeColor?: 'blue' | 'amber' | 'emerald';
}

interface SubmenuSection {
  heading: string;
  links: SubmenuLink[];
}

interface NavCategory {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  sections?: SubmenuSection[];
  featuredCard?: {
    tag: string;
    title: string;
    description: string;
    href: string;
    ctaText: string;
  };
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'all',
    label: 'All Products',
    href: '/products',
    icon: Layers,
    sections: [
      {
        heading: 'Hardware Categories',
        links: [
          { title: 'Laptops & Mobile Workstations', href: '/products?category=cat_laptops', description: 'Intel Core Ultra & AMD Ryzen AI systems' },
          { title: 'Processors & Enterprise CPUs', href: '/products?category=cat_components', description: 'Intel Core 14th Gen, Xeon & AMD Ryzen' },
          { title: 'Discrete Graphics & AI Accelerators', href: '/products?category=cat_components', description: 'NVIDIA RTX 40-series and CUDA workstations' },
          { title: 'High-Speed NVMe & Enterprise SSDs', href: '/products?category=cat_storage', description: 'PCIe Gen5 / Gen4 ultra-fast datacenter storage' },
          { title: 'Enterprise Rackmount Servers', href: '/products?category=cat_servers', description: '1U/2U High-density compute & virtualization' },
        ],
      },
      {
        heading: 'Procurement Services & Tools',
        links: [
          { title: 'Hardware Comparison Matrix', href: '/compare', badge: 'Compare', badgeColor: 'blue', description: 'Side-by-side spec & architecture comparison' },
          { title: 'Custom PC Configurator', href: '/pc-builder', badge: 'Interactive', badgeColor: 'emerald', description: 'Interactive component compatibility builder' },
          { title: 'B2B Corporate Quotation Desk', href: '/request-quote', badge: 'Corporate', badgeColor: 'amber', description: 'Tax-exempt VAT invoices & bulk container rates' },
          { title: 'Official GCC Warranty Verification', href: '/warranty', description: 'Verify manufacturer SLA & on-site coverage' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Enterprise Hardware Hub',
      title: '500+ Genuine UAE SKUs',
      description: 'Factory-sealed hardware with official manufacturer GCC warranty and express UAE same-day courier dispatch.',
      href: '/products',
      ctaText: 'Explore Complete Catalog',
    },
  },
  {
    id: 'laptops',
    label: 'Laptops',
    href: '/products?category=cat_laptops',
    sections: [
      {
        heading: 'Form Factors & Categories',
        links: [
          { title: 'Mobile Workstations', href: '/products?category=cat_laptops&type=workstation', description: 'Extreme CPU & GPU power for CAD, 3D & software engineering' },
          { title: 'Executive Ultrabooks', href: '/products?category=cat_laptops&type=business', description: 'Ultra-thin lightweight chassis with all-day battery efficiency' },
          { title: 'High-Performance Gaming Laptops', href: '/products?category=cat_laptops&type=gaming', description: 'GeForce RTX 4080/4070 series with high refresh QHD displays' },
          { title: 'AI-Accelerated Laptops', href: '/products?category=cat_laptops&type=ai', badge: 'NPU Core', badgeColor: 'blue', description: 'Intel Core Ultra & AMD Ryzen AI with dedicated neural silicon' },
        ],
      },
      {
        heading: 'Featured OEM Series',
        links: [
          { title: 'Lenovo Legion 5 & ThinkPad Pro', href: '/products?search=Lenovo', description: 'Dual-fan coldfront cooling with certified enterprise endurance' },
          { title: 'Acer Aspire AI & Nitro Series', href: '/products?search=Acer', description: 'Swift AI compute with DDR5 & multi-lane PCIe 4.0 expansion' },
          { title: 'HP ZBook & ProBook Systems', href: '/products?search=HP', description: 'Military-spec durability with Wolf Pro Security built-in' },
          { title: 'Bespoke RAM & SSD Upgrades', href: '/products?category=cat_laptops', badge: 'Custom', badgeColor: 'amber', description: 'Request bespoke 32GB/64GB factory memory configurations' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Featured Workstation',
      title: 'Lenovo Legion 5 15IRX10',
      description: 'Intel Core i7-14650HX 16-Core with RTX 4060 8GB, 16GB DDR5-5600, 1TB Gen4 NVMe, and 165Hz IPS 100% sRGB display.',
      href: '/products?search=Legion',
      ctaText: 'View Laptop Lineup',
    },
  },
  {
    id: 'components',
    label: 'Processors & GPUs',
    href: '/products?category=cat_components',
    sections: [
      {
        heading: 'Processors & Compute Nodes',
        links: [
          { title: 'Intel Core 14th Gen & Core Ultra', href: '/products?category=cat_components&brand=Intel', badge: 'LGA1700', badgeColor: 'blue', description: 'i9-14900K 24-core flagship with up to 6.0 GHz boost' },
          { title: 'AMD Ryzen 9000 & 7000 Series', href: '/products?category=cat_components&brand=AMD', badge: 'AM5', badgeColor: 'amber', description: 'Zen 5 desktop architectures with high multi-threaded performance' },
          { title: 'Server Processors (Xeon & EPYC)', href: '/products?category=cat_components&type=server', description: 'High-density multi-lane compute for enterprise virtualization' },
          { title: 'Z790 & X670E Motherboards', href: '/products?category=cat_components&type=motherboards', description: 'Enthusiast VRM power stages with PCIe 5.0 and DDR5 lanes' },
        ],
      },
      {
        heading: 'Graphics & Accelerators',
        links: [
          { title: 'NVIDIA GeForce RTX 4090 / 4080', href: '/products?category=cat_components&brand=NVIDIA', badge: 'Ada Lovelace', badgeColor: 'emerald', description: 'Ultimate gaming and 3D rendering with DLSS 3 frame generation' },
          { title: 'NVIDIA RTX Enterprise & AI Ada', href: '/products?category=cat_components&type=enterprise-gpu', description: 'Massive VRAM capacities for LLM fine-tuning and AI development' },
          { title: 'High-Wattage ATX 3.0 Power Supplies', href: '/products?category=cat_components&type=psu', description: 'Native 12VHPWR PCIe 5.0 80+ Gold and Platinum efficiency' },
          { title: 'Liquid & Air Cooling Solutions', href: '/products?category=cat_components&type=cooling', description: '360mm AIO radiators and dual-tower high-CFM air coolers' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Flagship Compute',
      title: 'Intel Core i9-14900K',
      description: '24 cores, 32 threads, 36MB Intel Smart Cache, unlocked multiplier for extreme rendering workloads.',
      href: '/products?search=14900K',
      ctaText: 'Explore Processors',
    },
  },
  {
    id: 'storage',
    label: 'Storage & NVMe SSDs',
    href: '/products?category=cat_storage',
    sections: [
      {
        heading: 'Solid State & NVMe Drives',
        links: [
          { title: 'PCIe Gen5 M.2 NVMe SSDs', href: '/products?category=cat_storage&speed=gen5', badge: '14,000 MB/s', badgeColor: 'emerald', description: 'Next-generation sequential read and write speeds for heavy I/O' },
          { title: 'PCIe Gen4 M.2 NVMe High-End', href: '/products?category=cat_storage&speed=gen4', description: 'Samsung 990 PRO, Kingston KC3000 & WD Black SN850X' },
          { title: 'Enterprise SAS & U.2 / U.3 SSDs', href: '/products?category=cat_storage&type=enterprise', description: 'Continuous 24/7 duty cycle drives with power-loss protection' },
          { title: 'High-Density 3.5" Enterprise HDDs', href: '/products?category=cat_storage&type=hdd', description: 'Seagate Exos & WD Gold 16TB to 24TB RAID storage' },
        ],
      },
      {
        heading: 'System Memory & Expansion',
        links: [
          { title: 'DDR5 High-Speed Desktop Kits', href: '/products?category=cat_components&type=ram', badge: '6000MHz+', badgeColor: 'blue', description: 'Low-latency AMD EXPO and Intel XMP 3.0 memory kits' },
          { title: 'ECC Registered Server Memory', href: '/products?category=cat_components&type=ecc', description: 'Multi-bit error checking for mission-critical infrastructure' },
          { title: 'Rugged Portable & Thunderbolt SSDs', href: '/products?category=cat_storage&type=external', description: 'Shock-resistant USB 3.2 Gen2x2 and Thunderbolt 4 drives' },
          { title: 'M.2 Aluminum Heatsinks & Docks', href: '/products?category=cat_components&type=accessories', description: 'High-efficiency passive dissipation and multi-bay enclosures' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Tier-1 Storage',
      title: 'Samsung 990 PRO 2TB NVMe',
      description: 'Sequential read speeds up to 7,450 MB/s with smart thermal control and 1200 TBW endurance rating.',
      href: '/products?search=990+PRO',
      ctaText: 'View Storage Range',
    },
  },
  {
    id: 'servers',
    label: 'Servers & Enterprise',
    href: '/products?category=cat_servers',
    sections: [
      {
        heading: 'Rackmount & Compute Nodes',
        links: [
          { title: '1U & 2U Enterprise Rack Servers', href: '/products?category=cat_servers&form=rack', description: 'Dell PowerEdge & HPE ProLiant multi-core virtualization engines' },
          { title: 'Dual-Socket AI Compute Platforms', href: '/products?category=cat_servers&type=compute', description: 'High-density multi-GPU chassis for deep learning clusters' },
          { title: 'Enterprise NAS & SAN Storage Vaults', href: '/products?category=cat_servers&type=san', description: 'Multi-bay 10GbE network attached arrays with RAID protection' },
          { title: 'Server Rack Enclosures & PDUs', href: '/products?category=cat_servers&type=enclosures', description: '42U datacenter racks with metered and switched power strips' },
        ],
      },
      {
        heading: 'Enterprise Solutions & SLAs',
        links: [
          { title: 'Custom RAID & OS Pre-installation', href: '/products?category=cat_servers', badge: 'Bespoke', badgeColor: 'amber', description: 'Custom hardware array setup and hypervisor provisioning' },
          { title: 'Hot-Swap Redundant Power Modules', href: '/products?category=cat_components&type=psu', description: 'Platinum and Titanium certified hot-pluggable server supplies' },
          { title: 'Enterprise Hardware SLAs', href: '/warranty', description: 'Next-business-day on-site technical support across the UAE' },
          { title: 'Volume B2B Project Procurement', href: '/request-quote', badge: 'Corporate', badgeColor: 'blue', description: 'Direct distributor pricing and dedicated account managers' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Datacenter Solution',
      title: 'High-Density 2U Rack Servers',
      description: 'Scalable dual-processor architectures designed for virtualization, database hosting, and private enterprise cloud.',
      href: '/products?category=cat_servers',
      ctaText: 'Inquire for Enterprise',
    },
  },
  {
    id: 'networking',
    label: 'Networking & PoE',
    href: '/products?category=cat_networking',
    sections: [
      {
        heading: 'Switching & Core Infrastructure',
        links: [
          { title: '10GbE & 100GbE Managed Switches', href: '/products?category=cat_networking&type=managed-switch', badge: '10GbE SFP+', badgeColor: 'emerald', description: 'Low-latency L2+/L3 switches with non-blocking switching fabrics' },
          { title: 'PoE+ Gigabit Edge Switches', href: '/products?category=cat_networking&type=poe', description: 'Power over Ethernet up to 370W for cameras and access points' },
          { title: 'Enterprise Hardware Firewalls', href: '/products?category=cat_networking&type=firewalls', description: 'Next-generation threat protection and multi-WAN balancing' },
          { title: 'Core Rackmount Routers', href: '/products?category=cat_networking&type=routers', description: 'High-throughput enterprise routing with BGP & OSPF routing' },
        ],
      },
      {
        heading: 'Connectivity & Optical Links',
        links: [
          { title: 'Wi-Fi 7 & 6E Access Points', href: '/products?category=cat_networking&type=wifi', badge: 'Wi-Fi 7', badgeColor: 'blue', description: 'Ultra-dense multi-user MIMO for office and campus deployments' },
          { title: 'SFP+ & QSFP28 Transceivers & DACs', href: '/products?category=cat_networking&type=optical', description: '10G/25G/100G multi-mode and single-mode optical modules' },
          { title: 'Cat6A / Cat7 Shielded Cabling', href: '/products?category=cat_accessories', description: 'Snagless shielded twisted pair patch cords for 10Gbps runs' },
          { title: 'Keystone Patch Panels & Organizers', href: '/products?category=cat_networking', description: '19-inch high-density horizontal and vertical cable management' },
        ],
      },
    ],
    featuredCard: {
      tag: 'Enterprise Network',
      title: 'Managed Multi-Gig Infrastructure',
      description: 'High-reliability networking engineered for seamless zero-packet-drop communication across campus environments.',
      href: '/products?category=cat_networking',
      ctaText: 'Explore Networking',
    },
  },
  {
    id: 'compare',
    label: 'Hardware Compare',
    href: '/compare',
  },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { user, role, reseller, logout } = useAuth();
  const { cartCount, wishlistCount, cart, clearCart } = useCart();
  const { currentCurrency, availableCurrencies, setCurrency, formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeCategoryData = useMemo(
    () => NAV_CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory]
  );

  const handleMouseEnter = (catId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveCategory(catId);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 160);
  };

  const handleSubmenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    setActiveCategory(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCategory(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const submenuVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -8,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.2,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -5,
      scale: shouldReduceMotion ? 1 : 0.99,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.16,
        ease: 'easeIn' as const,
      },
    },
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR (Dynamic Framer Motion Notification Banner) */}
      <TopAnnouncementBar />

      {/* 2. STICKY MAIN HEADER & SUB-NAVIGATION BAR (Sticks to top on scroll) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200 shadow-sm">
        {/* MAIN HEADER BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-md shadow-slate-200/60 dark:shadow-black/30 group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300 shrink-0 flex items-center justify-center p-0.5">
            <img
              src="/images/nextech-logo.png"
              alt="NexTech Systems Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 leading-none">
              <span>NEXTECH</span>
              <span className="text-tech-blue dark:text-cyan-400 hidden xs:inline">SYSTEMS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block ml-0.5"></span>
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 hidden sm:block truncate">
              Enterprise Technology Platform
            </div>
          </div>
        </Link>

        {/* Search Field (Executive Enterprise Search Bar) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
          <div className="relative flex items-center group">
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-tech-blue dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              id="navbar-desktop-search"
              aria-label="Search enterprise hardware, SKUs, LGA1700, RTX..."
              suppressHydrationWarning
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search enterprise hardware, SKUs, LGA1700, RTX..."
              className="w-full bg-slate-100/75 hover:bg-slate-100/95 dark:bg-slate-900/70 dark:hover:bg-slate-900/90 text-slate-900 dark:text-white pl-10 pr-14 py-2 rounded-xl text-xs font-medium border border-slate-200/90 dark:border-slate-800 focus:border-tech-blue dark:focus:border-cyan-400/80 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-tech-blue/15 dark:focus:ring-cyan-500/15 focus:outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
            />

            <div className="absolute right-2.5 flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-command-palette'));
                  }
                }}
                className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:border-slate-600 transition-all cursor-pointer shadow-2xs"
                title="Global Quick Find (⌘K / Ctrl+K)"
              >
                <span>⌘</span>
                <span>K</span>
              </button>
            </div>
          </div>
        </form>

        {/* Right Navigation Actions (Sleek Modern Segment) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Multi-Currency FX Selector (Enterprise Switcher - visible on sm+) */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer group"
              title={`Active Currency: ${currentCurrency.name} (${currentCurrency.code})`}
              aria-label="Currency Selector"
            >
              {currentCurrency.code === 'AED' ? (
                <DirhamSymbol
                  size={16}
                  weight="bold"
                  className="text-slate-900 dark:text-white transition-transform duration-200 group-hover:scale-110"
                />
              ) : (
                <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                  {currentCurrency.symbol || currentCurrency.code}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>Select Currency</span>
                    <span className="text-[9px] font-mono text-tech-blue">GCC & Global</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {availableCurrencies.map(cur => {
                      const isSelected = cur.code === currentCurrency.code;
                      return (
                        <button
                          key={cur.code}
                          type="button"
                          onClick={() => {
                            setCurrency(cur.code);
                            setCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{cur.flag}</span>
                            <div className="text-left">
                              <div className="font-bold text-xs leading-none">{cur.code}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{cur.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                              {cur.code === 'AED' ? (
                                <DirhamSymbol size={14} weight="bold" className="text-slate-900 dark:text-white" />
                              ) : (
                                cur.symbol
                              )}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-tech-blue" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-command-palette'));
              }
            }}
            className="md:hidden p-2 sm:p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm shrink-0"
            title="Search Products (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button - visible on sm+ */}
          <div className="hidden sm:block shrink-0">
            <ThemeToggle className="rounded-2xl" />
          </div>

          {/* Wishlist Button - visible on sm+ */}
          <Link
            href="/account/wishlist"
            className="hidden sm:flex relative p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm group shrink-0"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-red-500 transition-colors" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Modern Cart Button (Always visible) */}
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 sm:gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-blue-50 dark:bg-slate-800 text-tech-blue dark:text-cyan-300 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-blue dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all duration-200 font-bold text-xs shadow-sm group shrink-0"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {user && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-tech-blue text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-mono text-xs">
              {user && cart.total > 0 ? formatPrice(cart.total) : 'Cart'}
            </span>
          </Link>

          {/* Modern Profile / User Button - visible on sm+ */}
          <div className="relative hidden sm:block shrink-0">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm"
            >
              <div className="w-7 h-7 rounded-xl bg-tech-blue text-white flex items-center justify-center font-black text-xs shadow-xs">
                {user ? user.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user ? user.name.split(' ')[0] : 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
            </button>

            {/* Profile Dropdown Menu (Ant Design / Shadcn Card Style) */}
            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 origin-top-right"
                >
                {user ? (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${
                          role === 'ADMIN'
                            ? 'bg-blue-600'
                            : 'bg-tech-blue'
                        } text-white flex items-center justify-center font-black text-sm shadow-sm`}>
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {user.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                : role === 'RESELLER'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            }`}>
                              {role === 'ADMIN' ? 'SYSTEM ADMIN' : user.role}
                            </span>
                            {role !== 'ADMIN' && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                Wallet: {formatPrice((user as any).walletBalance || 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Specific Shortcuts */}
                    {role === 'ADMIN' ? (
                      <div className="space-y-1">
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                          <span>Admin Command Center</span>
                        </Link>

                        <Link
                          href="/admin/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Order Verification & Cargo Desk</span>
                        </Link>

                        <Link
                          href="/admin/purchase-orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Purchase Orders & Inventory</span>
                        </Link>

                        <Link
                          href="/admin/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>System & Audit Settings</span>
                        </Link>
                      </div>
                    ) : role === 'RESELLER' ? (
                      <div className="space-y-1">
                        <Link
                          href={`/reseller/${reseller?.resellerCode || 'comnet101'}/dashboard`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        >
                          <Store className="w-4 h-4 shrink-0" />
                          <span>Reseller Portal ({reseller?.resellerCode || 'Vendor'})</span>
                        </Link>

                        <Link
                          href={`/reseller/${reseller?.resellerCode || 'comnet101'}/orders`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Client Wholesale Orders</span>
                        </Link>

                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Commercial Profile</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Customer Profile & Address</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Orders & Verified E-Bills</span>
                        </Link>

                        <Link
                          href="/account/wishlist"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Saved Wishlist ({wishlistCount})</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                      <button
                        onClick={() => {
                          clearCart();
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3">
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block w-full py-2.5 bg-tech-blue text-white text-center text-xs font-bold rounded-2xl hover:bg-blue-600 transition-colors shadow-md"
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION CATEGORIES BAR WITH FRAMER MOTION INTERACTION */}
      <nav
        className="relative border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 hidden md:block"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {NAV_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const hasSubmenu = !!cat.sections && cat.sections.length > 0;
              const Icon = cat.icon;

              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                >
                  <Link
                    href={cat.href}
                    onClick={() => setActiveCategory(null)}
                    onFocus={() => handleMouseEnter(cat.id)}
                    className={`relative z-10 px-3 py-1.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'text-tech-blue dark:text-cyan-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
                    }`}
                    aria-expanded={isActive}
                    aria-haspopup={hasSubmenu}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span>{cat.label}</span>
                    {hasSubmenu && (
                      <ChevronDown
                        className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                          isActive ? 'rotate-180 text-tech-blue dark:text-cyan-400 opacity-100' : ''
                        }`}
                      />
                    )}
                  </Link>

                  {/* Shared animated hover pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-category-pill"
                      className="absolute inset-0 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg z-0"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 450, damping: 35 }
                      }
                    />
                  )}

                  {/* Shared animated underline indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-category-underline"
                      className="absolute -bottom-1.5 left-2 right-2 h-[2px] bg-tech-blue dark:bg-cyan-400 rounded-full z-20 shadow-xs shadow-tech-blue/30"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 450, damping: 35 }
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/products?featured=true"
            onMouseEnter={handleMouseLeave}
            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1.5 text-[11px] shrink-0 ml-4 py-1.5"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>Deals & Bundles</span>
          </Link>
        </div>

        {/* SUBMENU MEGA-PANEL ENTRANCE & INTERACTION (ANIMATEPRESENCE) */}
        <AnimatePresence>
          {activeCategory && activeCategoryData?.sections && (
            <motion.div
              key="category-submenu-panel"
              variants={submenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseEnter={handleSubmenuMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute top-full left-0 right-0 z-50 pt-1 pointer-events-auto origin-top"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/98 dark:bg-[#0B101D]/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/60 p-6 overflow-hidden">
                  <motion.div
                    key={activeCategoryData.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0.05 : 0.16, ease: 'easeOut' }}
                    className="grid grid-cols-12 gap-6"
                  >
                    {/* Left & Middle: Category Sections */}
                    <div className="col-span-8 grid grid-cols-2 gap-6">
                      {activeCategoryData.sections.map((section) => (
                        <div key={section.heading} className="space-y-1.5">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                            <span>{section.heading}</span>
                          </div>
                          <div className="space-y-0.5">
                            {section.links.map((link) => (
                              <Link
                                key={link.title}
                                href={link.href}
                                onClick={() => setActiveCategory(null)}
                                className="group/item flex items-start gap-2.5 p-2 rounded-xl transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 cursor-pointer block"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <motion.span
                                      className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-tech-blue dark:group-hover/item:text-cyan-400 transition-colors duration-150 inline-block"
                                      whileHover={shouldReduceMotion ? undefined : { x: 3 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                      {link.title}
                                    </motion.span>
                                    {link.badge && (
                                      <span
                                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                                          link.badgeColor === 'amber'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                                            : link.badgeColor === 'emerald'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-cyan-400 border border-blue-200 dark:border-blue-900/50'
                                        }`}
                                      >
                                        {link.badge}
                                      </span>
                                    )}
                                    <ChevronRight className="w-3 h-3 text-tech-blue dark:text-cyan-400 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-150 shrink-0 ml-auto" />
                                  </div>
                                  {link.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                                      {link.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: Featured Showcase Card */}
                    {activeCategoryData.featuredCard && (
                      <div className="col-span-4 border-l border-slate-100 dark:border-slate-800/80 pl-6 flex flex-col justify-between">
                        <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-full group/card hover:border-tech-blue/50 dark:hover:border-cyan-500/50 transition-colors">
                          <div>
                            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-tech-blue dark:bg-blue-950/60 dark:text-cyan-400 border border-blue-200 dark:border-blue-900/50 mb-2.5">
                              {activeCategoryData.featuredCard.tag}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {activeCategoryData.featuredCard.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                              {activeCategoryData.featuredCard.description}
                            </p>
                          </div>

                          <Link
                            href={activeCategoryData.featuredCard.href}
                            onClick={() => setActiveCategory(null)}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-tech-blue dark:text-cyan-400 hover:underline group-hover/card:translate-x-0.5 transition-transform"
                          >
                            <span>{activeCategoryData.featuredCard.ctaText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Submenu Footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Official GCC Manufacturer Warranties • Dedicated UAE Corporate Allocation Desk</span>
                    </div>
                    <Link
                      href={activeCategoryData.href}
                      onClick={() => setActiveCategory(null)}
                      className="text-xs font-bold text-tech-blue dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Browse all {activeCategoryData.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 4. MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
          >
          {/* Mobile Top Controls: Currency + Theme + Wishlist */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80">
            {/* Currency Select */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-base leading-none shrink-0">{currentCurrency.flag}</span>
              <select
                value={currentCurrency.code}
                onChange={e => setCurrency(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
                aria-label="Select Currency"
              >
                {availableCurrencies.map(c => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />

            {/* Theme Toggle */}
            <div className="shrink-0">
              <ThemeToggle className="rounded-xl" />
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />

            {/* Wishlist Link */}
            <Link
              href="/account/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="relative p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                id="navbar-mobile-search"
                aria-label="Search CPUs, GPUs, servers, SSDs"
                suppressHydrationWarning
                placeholder="Search CPUs, GPUs, servers, SSDs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-700 pr-20 focus:outline-none focus:border-tech-blue"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs bg-tech-blue text-white px-3 py-1.5 rounded-xl font-bold">
                Search
              </button>
            </div>
          </form>

          {/* Quick Primary Access Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-tech-blue" />
              <span>All Catalog</span>
            </Link>
            <Link
              href="/pc-builder"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 text-tech-blue dark:text-cyan-400 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <NextechLogo className="w-4 h-4" size={16} alt="PC Builder" />
              <span>PC Builder</span>
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Compare</span>
            </Link>
            <Link
              href="/products?featured=true"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 text-amber-500 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Deals & Offers</span>
            </Link>
          </div>

          {/* Categories Quick List with Framer Motion Accordion */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 mb-1">
              Hardware Categories
            </div>
            {NAV_CATEGORIES.filter((c) => c.id !== 'compare').map((cat) => {
              const isExpanded = expandedMobileCategory === cat.id;
              const hasSubmenu = !!cat.sections && cat.sections.length > 0;
              const Icon = cat.icon;

              return (
                <div
                  key={cat.id}
                  className="rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between p-2">
                    <Link
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-tech-blue dark:hover:text-cyan-400 flex items-center gap-2 flex-1"
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />}
                      <span>{cat.label}</span>
                    </Link>
                    {hasSubmenu && (
                      <button
                        type="button"
                        onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        aria-label={`Toggle ${cat.label} subcategories`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {isExpanded && cat.sections && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
                        className="overflow-hidden bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 p-2 space-y-1"
                      >
                        {cat.sections
                          .flatMap((s) => s.links)
                          .slice(0, 4)
                          .map((sub) => (
                            <Link
                              key={sub.title}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-tech-blue dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                            >
                              {sub.title}
                            </Link>
                          ))}
                        <Link
                          href={cat.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-2 py-1 text-[11px] font-bold text-tech-blue dark:text-cyan-400 hover:underline pt-0.5"
                        >
                          View all {cat.label} →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Account Tools */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            {user ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                      role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {role === 'ADMIN' ? 'Admin' : user.role}
                    </span>
                  </div>
                  {role !== 'ADMIN' && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Wallet: {formatPrice((user as any).walletBalance || 0)}
                    </span>
                  )}
                </div>
                {role === 'ADMIN' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-blue-600 text-white text-center font-bold text-xs shadow-xs"
                    >
                      Admin Center
                    </Link>
                    <Link
                      href="/admin/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-center font-bold text-xs"
                    >
                      Cargo & Orders
                    </Link>
                    <Link
                      href="/admin/purchase-orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-center font-bold text-xs"
                    >
                      Purchase Orders
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-center font-bold text-xs"
                    >
                      Settings
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-xs"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-xs"
                    >
                      Orders & Bills
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => {
                    clearCart();
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center text-[11px] font-bold text-red-500 hover:underline pt-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 bg-tech-blue text-white font-bold text-center rounded-2xl shadow-md"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </header>
    </>
  );
}
