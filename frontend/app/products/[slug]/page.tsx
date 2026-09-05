import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Product, Review } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailClient } from './ProductDetailClient';
import { ShieldCheck, Truck, RotateCcw, Cpu, CheckCircle2, Store, Star } from 'lucide-react';
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
    if (!res.ok) return { product: null, reviews: [], relatedProducts: [] };
    const json = await res.json();
    return json.data || { product: null, reviews: [], relatedProducts: [] };
  } catch (err) {
    console.error('Error loading product details:', err);
    return { product: null, reviews: [], relatedProducts: [] };
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const { product, reviews, relatedProducts } = await getProductData(slug);

  if (!product) {
    notFound();
  }

  const specEntries = Object.entries(product.specifications || {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 flex items-center gap-1.5">
        <Link href="/" className="hover:text-tech-blue">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-tech-blue">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${product.categoryId}`} className="hover:text-tech-blue">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Hero Grid */}
      <ProductDetailClient product={product} />

      {/* Technical Specifications Matrix */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-tech-blue/10 flex items-center justify-center text-tech-cyan">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Technical Specifications Matrix</h3>
            <p className="text-xs text-slate-400">Verified hardware parameters for system integration & compatibility</p>
          </div>
        </div>

        {specEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
              >
                <span className="font-bold text-slate-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-mono font-semibold text-white text-right">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Standard specifications apply as per manufacturer datasheets.</p>
        )}

        {/* Features List */}
        {product.features && product.features.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Architectural Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white">Customer Ratings & Verified Feedback</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{product.rating.toFixed(1)} out of 5</span>
              <span className="text-xs text-slate-400">({product.reviewCount} Reviews)</span>
            </div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(rev => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rev.userName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-1.5 py-0.5 rounded font-bold">
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
                <div className="text-xs font-bold text-slate-200">{rev.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
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
