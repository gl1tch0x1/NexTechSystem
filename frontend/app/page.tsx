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

    return { products, categories, brands, content };
  } catch (err) {
    console.error('Error loading homepage data:', err);
    return { products: [], categories: [], brands: [], content: null };
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

  return (
    <div className="space-y-16 pb-20 transition-colors duration-200">
      {/* 1. HERO SHOWCASE WITH DYNAMIC HUD PREVIEW & SPEC RADAR */}
      {isEnabled('hero') && (
        <HeroShowcase products={products} highlights={content?.heroHighlights} />
      )}

      {/* 2. TIER-1 OEM MANUFACTURERS MARQUEE */}
      {isEnabled('brand_partners') && (
        <BrandMarquee brands={brands} />
      )}

      {/* MAIN CONTAINER FOR STRUCTURED SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 3. PROMOTIONAL VOUCHER BANNER (1-Click Copy TECH10 / Dynamic Coupon) */}
        {isEnabled('deals_banner') && content?.storeSettings?.isLandingDiscountBannerActive !== false && content?.activeCoupon && (
          <VoucherClaimBanner activeCoupon={content.activeCoupon} />
        )}

        {/* 4. VERIFIED HARDWARE MATRIX SHOWCASE (Ant Design Tabs + Search + Sort) */}
        {isEnabled('featured_catalog') && (
          <EnhancedHardwareMatrix products={products} />
        )}

        {/* 5. ENTERPRISE SOLUTIONS (AI Workstations, Rack Servers, 100GbE Switching) */}
        <EnterpriseSolutions solutions={content?.solutions} />

        {/* 6. PC BUILDER INTERACTIVE TEASER WITH POWER & SOCKET VALIDATOR */}
        {isEnabled('pc_builder_cta') && (
          <CompatibilityTeaser presets={content?.builderPresets} />
        )}

        {/* 7. HARDWARE TAXONOMY EXPLORER */}
        {isEnabled('categories_grid') && (
          <TaxonomyExplorer categories={categories} />
        )}

        {/* 8. LIVE BENCHMARKS & HARDWARE TELEMETRY */}
        <LiveStatsAndBenchmarks benchmarks={content?.benchmarks} />

        {/* 9. THE NEXTECH ADVANTAGE (Enterprise Bento Grid) */}
        {isEnabled('trust_features') && (
          <EnterpriseBentoGrid
            features={content?.features}
            title={getSection('trust_features')?.title}
            subtitle={getSection('trust_features')?.subtitle}
            description={getSection('trust_features')?.description}
          />
        )}

        {/* 10. VERIFIED ENTERPRISE CLIENT TESTIMONIALS */}
        <ClientTestimonials testimonials={content?.testimonials} />
      </div>
    </div>
  );
}

