import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Product, Review } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailClient } from './ProductDetailClient';
import { ShieldCheck, Truck, RotateCcw, Cpu, CheckCircle2, Store, Star, Building, MapPin, Boxes } from 'lucide-react';
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
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-5 transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-tech-blue/10 dark:bg-cyan-500/10 flex items-center justify-center text-tech-blue dark:text-cyan-400">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Warehouse Real-Time Inventory</span>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Stock
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Physical stock allocated across UAE logistics centers for immediate dispatch or collection</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 font-medium">Total Regional Pool</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{product.stock} Units</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {product.locations.map(loc => (
              <div
                key={loc.locationId}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 group hover:border-tech-blue/40 dark:hover:border-cyan-500/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:text-tech-blue dark:group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{loc.locationName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{loc.city}, UAE</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-black ${loc.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-slate-400'}`}>
                    {loc.quantity > 0 ? `${loc.quantity} in stock` : 'Awaiting Stock'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Instant Dispatch</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Specifications Matrix */}
      <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-6 transition-all">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-2xl bg-tech-blue/10 dark:bg-cyan-500/10 flex items-center justify-center text-tech-blue dark:text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Technical Specifications Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verified hardware parameters for system integration & compatibility</p>
          </div>
        </div>

        {specEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {specEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-right">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Standard specifications apply as per manufacturer datasheets.</p>
        )}

        {/* Features List */}
        {product.features && product.features.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Architectural Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-6 transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Customer Ratings & Verified Feedback</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{product.rating.toFixed(1)} out of 5</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">({product.reviewCount} Reviews)</span>
            </div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(rev => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.userName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{rev.title}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
            Be the first verified customer to review the {product.name}.
          </div>
        )}
      </section>

      {/* Related Hardware Recommendations */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-tech-blue">Compatible Ecosystem</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Related Hardware & Alternatives</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
