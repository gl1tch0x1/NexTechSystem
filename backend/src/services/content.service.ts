import {
  heroHighlightRepo,
  enterpriseSolutionRepo,
  benchmarkRepo,
  testimonialRepo,
  bentoFeatureRepo,
  builderPresetRepo
} from '../repositories/content.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import {
  HomePageContent,
  HeroHighlight,
  EnterpriseSolution,
  HardwareBenchmarkCategory,
  ClientTestimonial,
  BentoFeature,
  BuilderPreset,
  Coupon,
  StoreSettings
} from '../types/index.js';

export class ContentService {
  /**
   * Aggregates all dynamic home page and CMS content into a single optimized payload.
   */
  async getHomePageContent(): Promise<HomePageContent> {
    const [
      heroHighlights,
      solutions,
      benchmarks,
      testimonials,
      features,
      builderPresets,
      activeCoupons,
      settings,
      productsCount,
      categoriesCount,
      brandsCount
    ] = await Promise.all([
      heroHighlightRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      enterpriseSolutionRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      benchmarkRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      testimonialRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      bentoFeatureRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      builderPresetRepo.find({ where: [{ field: 'isActive', operator: '==', value: true }], orderBy: { field: 'order', direction: 'asc' } }),
      couponRepository.find({ where: [{ field: 'isActive', operator: '==', value: true }] }),
      settingsRepository.findById('global_settings'),
      productRepository.count({ where: [{ field: 'isActive', operator: '==', value: true }, { field: 'approvalStatus', operator: '==', value: 'APPROVED' }] }),
      categoryRepository.count({ where: [{ field: 'isActive', operator: '==', value: true }] }),
      brandRepository.count({ where: [{ field: 'isActive', operator: '==', value: true }] })
    ]);

    // Pick the most beneficial active coupon (e.g. TECH10)
    const featuredCoupon = activeCoupons.find(c => c.code === 'TECH10') || activeCoupons[0];

    return {
      heroHighlights,
      solutions,
      benchmarks,
      testimonials,
      features,
      builderPresets,
      activeCoupon: featuredCoupon,
      storeSettings: settings || undefined,
      stats: {
        totalProducts: productsCount,
        totalCategories: categoriesCount,
        totalBrands: brandsCount,
        authorizedPartnersCount: brandsCount
      }
    };
  }

  // Hero Highlights
  async getHeroHighlights(): Promise<HeroHighlight[]> {
    return heroHighlightRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }

  async createHeroHighlight(data: HeroHighlight): Promise<HeroHighlight> {
    return heroHighlightRepo.create(data);
  }

  async updateHeroHighlight(id: string, updates: Partial<HeroHighlight>): Promise<HeroHighlight | null> {
    return heroHighlightRepo.update(id, updates);
  }

  async deleteHeroHighlight(id: string): Promise<boolean> {
    return heroHighlightRepo.delete(id);
  }

  // Enterprise Solutions
  async getEnterpriseSolutions(): Promise<EnterpriseSolution[]> {
    return enterpriseSolutionRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }

  async createSolution(data: EnterpriseSolution): Promise<EnterpriseSolution> {
    return enterpriseSolutionRepo.create(data);
  }

  async updateSolution(id: string, updates: Partial<EnterpriseSolution>): Promise<EnterpriseSolution | null> {
    return enterpriseSolutionRepo.update(id, updates);
  }

  // Hardware Benchmarks
  async getBenchmarks(): Promise<HardwareBenchmarkCategory[]> {
    return benchmarkRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }

  async updateBenchmark(id: string, updates: Partial<HardwareBenchmarkCategory>): Promise<HardwareBenchmarkCategory | null> {
    return benchmarkRepo.update(id, updates);
  }

  // Testimonials
  async getTestimonials(): Promise<ClientTestimonial[]> {
    return testimonialRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }

  async createTestimonial(data: ClientTestimonial): Promise<ClientTestimonial> {
    return testimonialRepo.create(data);
  }

  // Bento Features
  async getBentoFeatures(): Promise<BentoFeature[]> {
    return bentoFeatureRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }

  async updateBentoFeature(id: string, updates: Partial<BentoFeature>): Promise<BentoFeature | null> {
    return bentoFeatureRepo.update(id, updates);
  }

  // Builder Presets
  async getBuilderPresets(): Promise<BuilderPreset[]> {
    return builderPresetRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
  }
}

export const contentService = new ContentService();
