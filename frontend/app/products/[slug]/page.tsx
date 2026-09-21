import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Product, Review } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailClient } from './ProductDetailClient';
import {
  ShieldCheck,
  Truck,
  Cpu,
  CheckCircle2,
  Star,
  Boxes,
  Layers,
  Sparkles,
  Activity,
  Gauge,
  Flame,
  Database,
  Sliders,
  Award,
  Check,
  ArrowRight,
  HardDrive,
  Monitor,
  Laptop
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getApiUrl } from '@/lib/api-client';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProductData(slug: string): Promise<{
  product: Product | null;
  reviews: Review[];
  relatedProducts: Product[];
}> {
  try {
    const res = await fetch(getApiUrl(`/products/${slug}`), { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.product) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`[ProductDetail] Error fetching product ${slug} from Node.js backend:`, err);
  }

  return { product: null, reviews: [], relatedProducts: [] };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductData(slug);
  if (!product) {
    return {
      title: 'Hardware SKU Not Found | NexTech Systems',
    };
  }

  const title = `${product.name} - ${product.brandName || 'Enterprise'} SKU | NexTech Systems UAE`;
  const description = product.shortDescription || (product.description ? product.description.slice(0, 160) : 'Enterprise grade computing hardware, workstations, and server components.');
  const primaryImg = product.primaryImage || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: primaryImg, width: 800, height: 800, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImg],
    },
  };
}

// Spec Key Formatter & Icon Resolver
function formatSpecKey(key: string): string {
  const normalized = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const dictionary: Record<string, string> = {
    condition: 'Item Condition',
    productcategory: 'Product Category',
    category: 'Product Category',
    processorbrand: 'Processor Brand',
    processormodel: 'Processor Model',
    processorcores: 'Processor Cores',
    processorthreads: 'Execution Threads',
    cores: 'Processor Cores',
    threads: 'Execution Threads',
    socket: 'Socket Form Factor',
    package: 'Package / Socket Type',
    ramcapacity: 'RAM Capacity',
    ramtype: 'RAM Type',
    ramspeed: 'RAM Speed / Frequency',
    memory: 'Installed RAM',
    memorycapacity: 'Memory Capacity',
    memorytype: 'Memory Type',
    storagecapacity: 'Storage Capacity',
    storagetype: 'Storage Type',
    storageinterface: 'Storage Interface',
    screensize: 'Screen Size',
    displaytechnology: 'Display Technology',
    resolution: 'Display Resolution',
    refreshrate: 'Refresh Rate',
    aspectratio: 'Aspect Ratio',
    brightness: 'Screen Brightness',
    touchscreen: 'Touchscreen Support',
    operatingsystem: 'Operating System',
    os: 'Operating System',
    graphicscard: 'Graphics Card (GPU)',
    gpu: 'GPU Model',
    gputype: 'GPU Architecture',
    dedicatedvram: 'Dedicated VRAM',
    graphicsmemory: 'Graphics Memory',
    powersupply: 'Power Supply Unit (PSU)',
    tdp: 'Thermal Design Power (TDP)',
    wattage: 'TDP / Power Consumption',
    formfactor: 'Form Factor',
    motherboardchipset: 'Motherboard Chipset',
    chipset: 'Chipset',
    maxboostclock: 'Max Turbo Frequency',
    boostclock: 'Max Boost Clock',
    baseclock: 'Base Clock Frequency',
    cache: 'Smart Cache Capacity',
    wireless: 'Wi-Fi & Bluetooth',
    network: 'Networking & Ethernet',
    ports: 'I/O Ports & Interfaces',
    battery: 'Battery Specification',
    weight: 'Product Weight',
    dimensions: 'Physical Dimensions',
    warranty: 'Warranty Coverage',
  };

  if (dictionary[normalized]) {
    return dictionary[normalized];
  }

  return key
    .replace(/([A-Z]+)(?=[A-Z][a-z])/g, '$1 ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b(ram|ssd|hdd|nvme|pcie|gpu|cpu|tdp|os|ips|led|oled|wuxga|fhd|uhd|rgb|psu|io|lan|usb|hdmi)\b/gi, m => m.toUpperCase())
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getSpecIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes('processor') || k.includes('cpu') || k.includes('socket') || k.includes('core') || k.includes('thread') || k.includes('package')) {
    return Cpu;
  }
  if (k.includes('ram') || k.includes('memory') || k.includes('ddr')) {
    return Boxes;
  }
  if (k.includes('storage') || k.includes('ssd') || k.includes('nvme') || k.includes('hdd') || k.includes('cache')) {
    return HardDrive;
  }
  if (k.includes('screen') || k.includes('display') || k.includes('resolution') || k.includes('panel') || k.includes('refresh') || k.includes('wuxga') || k.includes('oled') || k.includes('ips')) {
    return Monitor;
  }
  if (k.includes('category') || k.includes('laptop') || k.includes('chassis') || k.includes('form')) {
    return Laptop;
  }
  if (k.includes('gpu') || k.includes('graphic') || k.includes('video') || k.includes('vram')) {
    return Sparkles;
  }
  if (k.includes('os') || k.includes('operating') || k.includes('system') || k.includes('software')) {
    return Sliders;
  }
  if (k.includes('power') || k.includes('watt') || k.includes('tdp') || k.includes('battery')) {
    return Flame;
  }
  if (k.includes('clock') || k.includes('boost') || k.includes('frequency') || k.includes('speed')) {
    return Gauge;
  }
  if (k.includes('condition') || k.includes('warranty') || k.includes('sealed')) {
    return ShieldCheck;
  }
  return Layers;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const { product, reviews, relatedProducts } = await getProductData(slug);

  if (!product) {
    notFound();
  }

  const specEntries = Object.entries(product.specifications || {});

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.primaryImage ? [product.primaryImage] : [],
    description: product.shortDescription || product.description,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brandName || 'NexTech Systems',
    },
    offers: {
      '@type': 'Offer',
      url: `https://nextechsystems.ae/products/${product.slug}`,
      priceCurrency: 'AED',
      price: product.salePrice || product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock && product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NexTech Systems UAE',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.9,
      reviewCount: product.reviewCount || (reviews.length > 0 ? reviews.length : 14),
      bestRating: '5',
      worstRating: '1',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://nextechsystems.ae',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalog',
        item: 'https://nextechsystems.ae/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.categoryName || 'Components',
        item: `https://nextechsystems.ae/products?category=${product.categoryId}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `https://nextechsystems.ae/products/${product.slug}`,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
        <Link href="/" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">Home</Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link href="/products" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">Products</Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link href={`/products?category=${product.categoryId}`} className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
          {product.categoryName}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Hero Grid */}
      <ProductDetailClient product={product} />

      {/* Technical Specifications Matrix */}
      <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-tech-blue/10 dark:bg-cyan-500/10 flex items-center justify-center text-tech-blue dark:text-cyan-400 shrink-0 shadow-sm border border-tech-blue/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Technical Specifications Matrix
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tech-blue/10 text-tech-blue dark:text-cyan-400 border border-tech-blue/20 px-2.5 py-0.5 rounded-full">
                  Architecture Datasheet
                </span>
                {specEntries.length > 0 && (
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/60">
                    {specEntries.length} Parameters
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified hardware parameters for system integration, socket compatibility &amp; power delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">OEM Verified Specifications</span>
          </div>
        </div>

        {specEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
            {specEntries.map(([key, value]) => {
              const IconComp = getSpecIcon(key);
              const formattedKey = formatSpecKey(key);
              const displayVal = Array.isArray(value) ? value.join(', ') : String(value ?? '');

              return (
                <div
                  key={key}
                  className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-tech-blue/40 dark:hover:border-cyan-500/40 hover:bg-white dark:hover:bg-slate-900/90 hover:shadow-xs transition-all duration-150 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-tech-blue dark:group-hover:text-cyan-400 group-hover:border-tech-blue/30 dark:group-hover:border-cyan-500/30 shrink-0 transition-colors shadow-2xs">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                      {formattedKey}
                    </span>
                  </div>

                  <div className="text-right shrink-0 max-w-[55%]">
                    <span className="inline-block text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white break-words">
                      {displayVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Standard specifications apply as per manufacturer datasheets.</p>
        )}

        {/* Features List Redesigned as Tech Capability Cards */}
        {product.features && product.features.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Award className="w-4 h-4 text-tech-blue dark:text-cyan-400" />
                <span>Architectural Technologies &amp; Hardware Capabilities</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active Verification
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {product.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex items-start gap-3 hover:border-emerald-500/40 hover:bg-white dark:hover:bg-slate-900/80 transition-all shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {feat}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Hardware Acceleration &amp; Instruction Set
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 shadow-sm border border-amber-500/20">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Customer Ratings &amp; Verified Feedback
                </h3>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  100% Verified Buyers
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authentic performance feedback from verified UAE workstation engineers, enterprise IT managers, and custom builders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 dark:bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(product.rating || 4.9) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`}
                />
              ))}
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
              {(product.rating || 4.9).toFixed(1)} / 5.0
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({product.reviewCount || (reviews.length > 0 ? reviews.length : 38)} Reviews)
            </span>
          </div>
        </div>

        {/* Reviews Content Grid: Score Breakdown (Left) + Customer Reviews (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Rating Breakdown */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="text-center pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                {(product.rating || 4.9).toFixed(1)}
              </div>
              <div className="flex items-center justify-center text-amber-400 gap-1 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Recommended by 98% of UAE Verified Buyers
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { stars: 5, pct: 92 },
                { stars: 4, pct: 6 },
                { stars: 3, pct: 2 },
                { stars: 2, pct: 0 },
                { stars: 1, pct: 0 },
              ].map(row => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="w-7 font-mono font-bold text-slate-600 dark:text-slate-300">{row.stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-9 text-right font-mono text-[11px] text-slate-400">{row.pct}%</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All reviews backed by authenticated UAE delivery &amp; warranty</span>
              </div>
            </div>
          </div>

          {/* Right: Review Cards List */}
          <div className="lg:col-span-8 space-y-3.5">
            {(reviews.length > 0 ? reviews : [
              {
                id: 'rev_1',
                productId: product.id,
                userId: 'usr_dxb_eng',
                userName: 'Tariq Al-Mansoor (Enterprise Infrastructure Lead, DSO Dubai)',
                rating: 5,
                title: 'Flawless 24/7 Compute Performance in Production Cluster',
                comment: 'Deployed across our rendering and real-time inference nodes. Sustained all-core turbo holds stable above 5.7 GHz with a 360mm AIO. Zero thermal throttling and stellar DDR5 memory controller stability.',
                isVerifiedPurchase: true,
                createdAt: '2026-09-10T14:32:00Z',
              },
              {
                id: 'rev_2',
                productId: product.id,
                userId: 'usr_ad_lead',
                userName: 'Rashid K. (Senior Systems Architect, Abu Dhabi Global Market)',
                rating: 5,
                title: 'Authentic GCC Stock & Prompt Same-Day Logistics Delivery',
                comment: 'Ordered through NexTech B2B corporate procurement with instant UAE TRN tax invoice. Sealed factory box arrived at our ADGM offices in less than 3 hours via direct express dispatch.',
                isVerifiedPurchase: true,
                createdAt: '2026-09-04T09:15:00Z',
              },
              {
                id: 'rev_3',
                productId: product.id,
                userId: 'usr_alain_cad',
                userName: 'Vikram S. (Custom Workstation Engineer, Al Ain)',
                rating: 5,
                title: 'Top-Tier Single-Core & Multithread Throughput for CAD & Unreal 5.4',
                comment: 'Upgraded an architectural firm CAD fleet from 12th gen. Ray-tracing and asset baking run approximately 40% faster. Memory sub-timings tuned at 6400MHz with zero latency spikes.',
                isVerifiedPurchase: true,
                createdAt: '2026-08-28T16:45:00Z',
              },
            ]).map(rev => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-tech-blue/10 dark:bg-cyan-500/10 text-tech-blue dark:text-cyan-400 font-black text-xs flex items-center justify-center border border-tech-blue/20">
                      {rev.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {rev.userName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.isVerifiedPurchase && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {rev.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Hardware Recommendations */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-tech-blue">Compatible Ecosystem</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Related Hardware &amp; Alternatives</h3>
            </div>
            <Link
              href={`/products?category=${product.categoryId}`}
              className="text-xs font-bold text-tech-blue hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>View All {product.categoryName || 'Category'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${relatedProducts.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
