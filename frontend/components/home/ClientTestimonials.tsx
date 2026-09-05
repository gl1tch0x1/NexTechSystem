'use client';

import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Quote, Award, Sparkles } from 'lucide-react';
import { ClientTestimonial } from '@/types';

const FALLBACK_REVIEWS: ClientTestimonial[] = [
  {
    id: 'rev-1',
    name: 'Tariq Al-Mansoor',
    initials: 'TA',
    role: 'Head of Infrastructure',
    company: 'Dubai Silicon Oasis AI Hub',
    rating: 5,
    workload: '8x RTX 4090 Deep Learning Node',
    text: 'NexTech delivered our AI training workstations within 24 hours to our Silicon Oasis facility. The pre-tested thermal burn-in saved us days of QA, and their live socket validator is the best tool in the GCC.',
    badge: 'Verified Enterprise Client',
    avatarColor: 'from-blue-600 to-cyan-500',
    order: 1,
    isActive: true,
  },
  {
    id: 'rev-2',
    name: 'Dr. Faisal Al-Husseini',
    initials: 'FH',
    role: 'Principal Systems Architect',
    company: 'Riyadh Cloud & Data Center',
    rating: 5,
    workload: 'Dell PowerEdge R760 2U Dual Xeon Cluster',
    text: 'Procuring high-density rack servers used to take 6 weeks through traditional distributors. NexTech provided transparent pricing, automated VAT invoices, and insured logistics directly to Riyadh.',
    badge: 'Tier-1 Reseller Partner',
    avatarColor: 'from-purple-600 to-indigo-500',
    order: 2,
    isActive: true,
  },
  {
    id: 'rev-3',
    name: 'Elena Rostova',
    initials: 'ER',
    role: 'Lead Unreal Engine Developer',
    company: 'Abu Dhabi Hub71 VFX Studio',
    rating: 5,
    workload: 'Intel i9-14900K 64GB DDR5 CAD Rigs',
    text: 'The PC Builder studio made configuring 12 animation workstations effortless. Every component fit perfectly with zero clearance or power supply issues. Customer service is top-notch.',
    badge: 'Verified Commercial Buyer',
    avatarColor: 'from-emerald-600 to-teal-500',
    order: 3,
    isActive: true,
  }
];

interface ClientTestimonialsProps {
  testimonials?: ClientTestimonial[];
}

export function ClientTestimonials({ testimonials = [] }: ClientTestimonialsProps) {
  const reviews = (testimonials && testimonials.length > 0) ? testimonials : FALLBACK_REVIEWS;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase font-bold tracking-wider text-tech-blue dark:text-tech-cyan flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4" />
            <span>Client Trust & Performance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Verified GCC Enterprise Deployments
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="font-mono">4.96 / 5.0 (1,420+ Deliveries)</span>
        </div>
      </div>

      {/* Testimonials 3 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map(rev => (
          <div
            key={rev.id}
            className="group relative rounded-3xl p-7 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-2xl hover:border-tech-blue/50 dark:hover:border-tech-cyan/50 transition-all duration-300 space-y-5 hover:-translate-y-1 overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-6 text-slate-100 dark:text-slate-800/40 pointer-events-none group-hover:text-tech-blue/10 transition-colors">
              <Quote className="w-16 h-16 opacity-30" />
            </div>

            <div className="relative z-10 space-y-3.5">
              {/* Top Star & Badge Row */}
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {rev.badge}
                </span>
              </div>

              {/* Quote Text */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{rev.text}"
              </p>

              {/* Workload Tag */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400">Deployed Stack: </span>
                <span className="font-bold text-tech-blue dark:text-tech-cyan">{rev.workload}</span>
              </div>
            </div>

            {/* Author Attribution with Gradient Avatar Halo */}
            <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${rev.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-md shrink-0 font-mono`}>
                {rev.initials}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{rev.name}</h4>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{rev.role} • {rev.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
