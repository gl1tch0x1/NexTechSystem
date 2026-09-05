import React from 'react';
import Link from 'next/link';
import { Cpu, Shield, Truck, RefreshCw, Headphones, Lock, Sparkles } from 'lucide-react';
import CloudflareShieldBadge from '@/components/security/CloudflareShieldBadge';

export function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-[#050811] text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Trust Highlights Section (Ant Design / Shadcn inspired 4-column trust strip) */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tech-blue/10 border border-tech-blue/20 flex items-center justify-center text-tech-blue dark:text-tech-cyan shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">100% Authentic OEM</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Direct distributor warranties</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tech-blue/10 border border-tech-blue/20 flex items-center justify-center text-tech-blue dark:text-tech-cyan shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Express GCC Delivery</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Insured air/ground logistics</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tech-blue/10 border border-tech-blue/20 flex items-center justify-center text-tech-blue dark:text-tech-cyan shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Encrypted Escrow & Wallet</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">256-Bit SSL & Instant Ledger</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tech-blue/10 border border-tech-blue/20 flex items-center justify-center text-tech-blue dark:text-tech-cyan shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">24/7 Tech AI & Engineers</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Certified hardware support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-tech-blue to-tech-cyan flex items-center justify-center text-white shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              NEXTECH<span className="text-tech-blue">SYSTEMS</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm">
            Enterprise computing architecture, high-density AI servers, workstation GPUs, and certified hardware multi-seller marketplace.
          </p>
          <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
            TRN: TRN-10029384910003 • Silicon Oasis Tech Tower, Dubai, UAE
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Hardware Catalog</h4>
          <ul className="space-y-2">
            <li><Link href="/products?category=cat_components" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Processors (CPUs)</Link></li>
            <li><Link href="/products?category=cat_components" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Graphics Cards (GPUs)</Link></li>
            <li><Link href="/products?category=cat_components" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Motherboards & RAM</Link></li>
            <li><Link href="/products?category=cat_storage" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">NVMe Gen5 SSDs</Link></li>
            <li><Link href="/products?category=cat_servers" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Rackmount Servers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Enterprise Tools</h4>
          <ul className="space-y-2">
            <li><Link href="/pc-builder" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors font-bold text-tech-blue dark:text-tech-cyan">Custom PC Builder</Link></li>
            <li><Link href="/compare" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Hardware Comparison</Link></li>
            <li><Link href="/account/wallet" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Customer Wallet</Link></li>
            <li><Link href="/reseller/comnet101/login" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Reseller Vendor Portal</Link></li>
            <li><Link href="/admin" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Admin Command Center</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Assistance & Billing</h4>
          <ul className="space-y-2">
            <li><Link href="/account/orders" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Track Orders & E-Bills</Link></li>
            <li><Link href="/shipping" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Shipping & Delivery</Link></li>
            <li><Link href="/warranty" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Warranty & Claims</Link></li>
            <li><Link href="/privacy" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">Terms of Enterprise SLA</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <div>© 2026 NexTech Systems Enterprise FZCO. All rights reserved.</div>
        <div className="flex flex-wrap items-center gap-3">
          <CloudflareShieldBadge compact />
          <span>•</span>
          <span>PCI-DSS Certified</span>
          <span>•</span>
          <span>ISO 27001</span>
          <span>•</span>
          <span>GCC VAT Compliant</span>
        </div>
      </div>
    </footer>
  );
}
