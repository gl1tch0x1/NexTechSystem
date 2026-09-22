import React from 'react';
import { Product, Category, Brand, HomePageContent } from '@/types';
import { HeroShowcase } from '@/components/home/HeroShowcase';
import { BrandMarquee } from '@/components/home/BrandMarquee';
import { VoucherClaimBanner } from '@/components/home/VoucherClaimBanner';
import { EnhancedHardwareMatrix } from '@/components/home/EnhancedHardwareMatrix';
import { EnterpriseSolutions } from '@/components/home/EnterpriseSolutions';
import { CompatibilityTeaser } from '@/components/home/CompatibilityTeaser';
import { LiveStatsAndBenchmarks } from '@/components/home/LiveStatsAndBenchmarks';
import { EnterpriseBentoGrid } from '@/components/home/EnterpriseBentoGrid';
import { TaxonomyExplorer } from '@/components/home/TaxonomyExplorer';
import { ClientTestimonials } from '@/components/home/ClientTestimonials';
import { getApiUrl } from '@/lib/api-client';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from '@/lib/default-taxonomy';

async function getHomeData(): Promise<{
  products: Product[];
  categories: Category[];
  brands: Brand[];
  content: HomePageContent | null;
}> {
  try {
    const [resProd, resCat, resBrand, resContent] = await Promise.allSettled([
      fetch(getApiUrl('/products?limit=50'), { cache: 'no-store' }),
      fetch(getApiUrl('/products/categories'), { cache: 'no-store' }),
      fetch(getApiUrl('/products/brands'), { cache: 'no-store' }),
      fetch(getApiUrl('/content/homepage'), { cache: 'no-store' })
    ]);

    let products: Product[] = [];
    let categories: Category[] = [];
    let brands: Brand[] = [];
    let content: HomePageContent | null = null;

    if (resProd.status === 'fulfilled' && resProd.value.ok) {
      const json = await resProd.value.json();
      products = json.data || [];
    }

    if (resCat.status === 'fulfilled' && resCat.value.ok) {
      const json = await resCat.value.json();
      categories = json.data || [];
    }

    if (resBrand.status === 'fulfilled' && resBrand.value.ok) {
      const json = await resBrand.value.json();
      brands = json.data || [];
    }

    if (resContent.status === 'fulfilled' && resContent.value.ok) {
      const json = await resContent.value.json();
      content = json.data || null;
    }

    return {
      products,
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      brands: brands.length > 0 ? brands : DEFAULT_BRANDS,
      content,
    };
  } catch (err) {
    console.warn('[Home] Unable to load storefront content from the backend:', err);
    return {
      products: [],
      categories: DEFAULT_CATEGORIES,
      brands: DEFAULT_BRANDS,
      content: null,
    };
  }
}

export default async function HomePage() {
  const { products, categories, brands, content } = await getHomeData();

  const sections = content?.storeSettings?.storefrontSections;
  const isEnabled = (id: string) => {
    if (!sections || sections.length === 0) return true;
    const s = sections.find(x => x.id === id);
    return s ? (s.enabled !== false && s.isVisible !== false) : true;
  };
  const getSection = (id: string) => sections?.find(s => s.id === id);
  const hasStorefrontData = products.length > 0 || categories.length > 0 || brands.length > 0 || !!content;

  if (!hasStorefrontData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">Storefront status</p>
          <h1 className="mt-4 text-3xl font-bold text-white">Backend API is not reachable yet</h1>
          <p className="mt-4 text-base text-slate-300">
            The storefront is waiting for the deployed backend service. Set <span className="font-mono text-amber-300">NEXT_PUBLIC_API_URL</span> to your live API URL, for example:
          </p>
          <p className="mt-3 inline-block rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-sm text-sky-300">
            https://your-backend-url/api
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Then redeploy the frontend so the homepage can load products, categories, and content from the live database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20 transition-colors duration-200">
      {isEnabled('hero') && products.length > 0 && (
        <HeroShowcase products={products} highlights={content?.heroHighlights} />
      )}

      {isEnabled('brand_partners') && brands.length > 0 && (
        <BrandMarquee brands={brands} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {isEnabled('deals_banner') && content?.storeSettings?.isLandingDiscountBannerActive !== false && content?.activeCoupon && (
          <VoucherClaimBanner activeCoupon={content.activeCoupon} />
        )}

        {isEnabled('featured_catalog') && products.length > 0 && (
          <EnhancedHardwareMatrix products={products} />
        )}

        <EnterpriseSolutions solutions={content?.solutions} />

        {isEnabled('pc_builder_cta') && content?.builderPresets && content.builderPresets.length > 0 && (
          <CompatibilityTeaser presets={content.builderPresets} />
        )}

        {isEnabled('categories_grid') && categories.length > 0 && (
          <TaxonomyExplorer categories={categories} />
        )}

        {content?.benchmarks && content.benchmarks.length > 0 && (
          <LiveStatsAndBenchmarks benchmarks={content.benchmarks} />
        )}

        {isEnabled('trust_features') && (
          <EnterpriseBentoGrid
            features={content?.features}
            title={getSection('trust_features')?.title}
            subtitle={getSection('trust_features')?.subtitle}
            description={getSection('trust_features')?.description}
          />
        )}

        {content?.testimonials && content.testimonials.length > 0 && (
          <ClientTestimonials testimonials={content.testimonials} />
        )}
      </div>
    </div>
  );
}

