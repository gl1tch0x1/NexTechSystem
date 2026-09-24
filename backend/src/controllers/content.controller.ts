import { Request, Response } from 'express';
import { contentService } from '../services/content.service.js';

export class ContentController {
  /**
   * GET /api/content/homepage
   * Returns aggregated dynamic homepage content
   */
  async getHomePageContent(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getHomePageContent();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error('[ContentController.getHomePageContent] Error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_HOMEPAGE_CONTENT_ERROR',
          message: err.message || 'Failed to fetch homepage content',
        },
      });
    }
  }

  /**
   * GET /api/content/hero
   */
  async getHeroHighlights(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getHeroHighlights();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_HERO_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /api/content/solutions
   */
  async getSolutions(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getEnterpriseSolutions();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_SOLUTIONS_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /api/content/benchmarks
   */
  async getBenchmarks(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getBenchmarks();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_BENCHMARKS_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /api/content/testimonials
   */
  async getTestimonials(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getTestimonials();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_TESTIMONIALS_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /api/content/features
   */
  async getFeatures(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getBentoFeatures();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_FEATURES_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /api/content/builder-presets
   */
  async getBuilderPresets(_req: Request, res: Response): Promise<void> {
    try {
      const data = await contentService.getBuilderPresets();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_PRESETS_ERROR', message: err.message },
      });
    }
  }
}

export const contentController = new ContentController();
