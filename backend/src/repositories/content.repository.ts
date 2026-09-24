import { BaseRepository } from './base.repository.js';
import {
  HeroHighlight,
  EnterpriseSolution,
  HardwareBenchmarkCategory,
  ClientTestimonial,
  BentoFeature,
  BuilderPreset
} from '../types/index.js';

export class HeroHighlightRepository extends BaseRepository<HeroHighlight> {
  constructor() {
    super('hero_highlights');
  }
}

export class EnterpriseSolutionRepository extends BaseRepository<EnterpriseSolution> {
  constructor() {
    super('enterprise_solutions');
  }
}

export class BenchmarkRepository extends BaseRepository<HardwareBenchmarkCategory> {
  constructor() {
    super('hardware_benchmarks');
  }
}

export class TestimonialRepository extends BaseRepository<ClientTestimonial> {
  constructor() {
    super('testimonials');
  }
}

export class BentoFeatureRepository extends BaseRepository<BentoFeature> {
  constructor() {
    super('bento_features');
  }
}

export class BuilderPresetRepository extends BaseRepository<BuilderPreset> {
  constructor() {
    super('builder_presets');
  }
}

export const heroHighlightRepo = new HeroHighlightRepository();
export const enterpriseSolutionRepo = new EnterpriseSolutionRepository();
export const benchmarkRepo = new BenchmarkRepository();
export const testimonialRepo = new TestimonialRepository();
export const bentoFeatureRepo = new BentoFeatureRepository();
export const builderPresetRepo = new BuilderPresetRepository();
