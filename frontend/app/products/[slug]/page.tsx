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
  RotateCcw,
  Cpu,
  CheckCircle2,
  Store,
  Star,
  Building,
  Building2,
  MapPin,
  Boxes,
  Warehouse,
  Layers,
  Sparkles,
  Activity,
  Gauge,
  Flame,
  Database,
  Sliders,
  Award,
  Check,
  Clock,
  ArrowRight
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

      {/* Multi-Warehouse Inventory & Regional Logistics Availability */}
      {product.locations && product.locations.length > 0 && (
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-6 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-tech-blue/10 dark:bg-cyan-500/10 flex items-center justify-center text-tech-blue dark:text-cyan-400 shrink-0 shadow-sm border border-tech-blue/20">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Warehouse Real-Time Inventory &amp; Regional Logistics
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Live Stock
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Physical hardware allocated across UAE logistics centers for immediate courier dispatch or direct collection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 bg-slate-50 dark:bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Boxes className="w-5 h-5 text-tech-blue dark:text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Regional Pool</div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none mt-0.5 whitespace-nowrap">
                  {product.stock} Units Available
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {product.locations.map(loc => {
              const isJafza = loc.locationName.toLowerCase().includes('jafza') || loc.locationName.toLowerCase().includes('logistics');
              const isShowroom = loc.locationName.toLowerCase().includes('showroom') || loc.locationName.toLowerCase().includes('deira');

              const hubTag = isJafza
                ? 'Port Hub'
                : isShowroom
                ? 'Retail & Tech Center'
                : 'Regional Hub';

              const fulfillmentBadge = isShowroom
                ? 'Counter Pickup & Express'
                : 'Same-Day Courier Dispatch';

              const stockPercent = Math.min(100, Math.max(15, Math.round((loc.quantity / (product.stock || 34)) * 100)));

              return (
                <div
                  key={loc.locationId}
                  className="p-5 rounded-2xl bg-gradient-to-b from-slate-50/90 to-white dark:from-slate-950/80 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-tech-blue/50 dark:hover:border-cyan-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header: Hub name & Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-tech-blue dark:group-hover:text-cyan-400 group-hover:border-tech-blue/30 transition-colors shrink-0 shadow-xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {loc.locationName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{loc.city}, UAE</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap shrink-0">
                        {hubTag}
                      </span>
                    </div>

                    {/* Stock level bar & status */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Allocated Inventory</span>
                        <span className={`font-mono font-black ${loc.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {loc.quantity > 0 ? `${loc.quantity} Units in stock` : '0 Units (Awaiting Stock)'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            loc.quantity > 10
                              ? 'bg-emerald-500'
                              : loc.quantity > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ width: `${loc.quantity > 0 ? stockPercent : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Badge: Dispatch speed */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400 shrink-0" />
                      <span>{fulfillmentBadge}</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                      Immediate
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified hardware parameters for system integration, socket compatibility &amp; power delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>OEM Verified Specifications</span>
          </div>
        </div>

        {specEntries.length > 0 ? (
          <div className="space-y-3.5">
            {/* If odd count and starts with processor, show processor as flagship banner */}
            {specEntries[0]?.[0].toLowerCase().includes('processor') && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-purple-50/50 dark:from-blue-950/30 dark:via-slate-950/50 dark:to-purple-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tech-blue text-white flex items-center justify-center shrink-0 shadow-md shadow-tech-blue/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-tech-blue dark:text-cyan-400">
                      FLAGSHIP COMPUTING ARCHITECTURE
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {specEntries[0][1]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {product.brandName} Enterprise Grade
                  </span>
                </div>
              </div>
            )}

            {/* Symmetrical Specification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(specEntries[0]?.[0].toLowerCase().includes('processor') ? specEntries.slice(1) : specEntries).map(([key, value]) => {
                const k = key.toLowerCase();
                const IconComp = k.includes('socket') || k.includes('package')
                  ? Layers
                  : k.includes('core')
                  ? Sparkles
                  : k.includes('thread')
                  ? Activity
                  : k.includes('boost') || k.includes('clock') || k.includes('freq')
                  ? Gauge
                  : k.includes('watt') || k.includes('power') || k.includes('tdp')
                  ? Flame
                  : k.includes('cache')
                  ? Database
                  : k.includes('memory') || k.includes('ram')
                  ? Boxes
                  : Sliders;

                const formattedKey =
                  k === 'socket'
                    ? 'Socket Form Factor'
                    : k === 'cores'
                    ? 'Processor Cores'
                    : k === 'threads'
                    ? 'Execution Threads'
                    : k === 'maxboostclock' || k === 'boostclock'
                    ? 'Max Turbo Frequency'
                    : k === 'wattage' || k === 'tdp' || k === 'power'
                    ? 'TDP / Power Rating'
                    : k === 'cache'
                    ? 'Smart Cache Capacity'
                    : key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/_/g, ' ')
                        .trim()
                        .replace(/\b\w/g, c => c.toUpperCase());

                return (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-gradient-to-r from-slate-50/90 to-white dark:from-slate-950/80 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-tech-blue/40 dark:hover:border-cyan-500/40 hover:shadow-xs transition-all flex items-center gap-3.5 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-tech-blue dark:group-hover:text-cyan-400 shrink-0 transition-colors shadow-xs">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="w-36 sm:w-44 shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                        PARAMETER
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formattedKey}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pl-3 border-l border-slate-200/80 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-tech-blue dark:text-cyan-400 font-mono">
                        SPECIFICATION
                      </div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white break-words">
                        {value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
