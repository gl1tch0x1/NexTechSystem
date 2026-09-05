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

  return (
    <div className="space-y-16 pb-20 transition-colors duration-200">
      {/* 1. HERO SHOWCASE WITH DYNAMIC HUD PREVIEW & SPEC RADAR */}
      <HeroShowcase products={products} highlights={content?.heroHighlights} />

      {/* 2. TIER-1 OEM MANUFACTURERS MARQUEE */}
      <BrandMarquee brands={brands} />

      {/* MAIN CONTAINER FOR STRUCTURED SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 3. PROMOTIONAL VOUCHER BANNER (1-Click Copy TECH10 / Dynamic Coupon) */}
        <VoucherClaimBanner activeCoupon={content?.activeCoupon} />

        {/* 4. VERIFIED HARDWARE MATRIX SHOWCASE (Ant Design Tabs + Search + Sort) */}
        <EnhancedHardwareMatrix products={products} />

        {/* 5. ENTERPRISE SOLUTIONS (AI Workstations, Rack Servers, 100GbE Switching) */}
        <EnterpriseSolutions solutions={content?.solutions} />

        {/* 6. PC BUILDER INTERACTIVE TEASER WITH POWER & SOCKET VALIDATOR */}
        <CompatibilityTeaser presets={content?.builderPresets} />

        {/* 7. HARDWARE TAXONOMY EXPLORER */}
        <TaxonomyExplorer categories={categories} />

        {/* 8. LIVE BENCHMARKS & HARDWARE TELEMETRY */}
        <LiveStatsAndBenchmarks benchmarks={content?.benchmarks} />

        {/* 9. THE NEXTECH ADVANTAGE (Enterprise Bento Grid) */}
        <EnterpriseBentoGrid features={content?.features} />

        {/* 10. VERIFIED ENTERPRISE CLIENT TESTIMONIALS */}
        <ClientTestimonials testimonials={content?.testimonials} />
      </div>
    </div>
  );
}

