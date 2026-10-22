import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analytics.service.js';
import { productService } from '../services/product.service.js';
import { resellerService } from '../services/reseller.service.js';
import { orderService } from '../services/order.service.js';
import { excelImportService } from '../services/excel-import.service.js';
import { productRepository } from '../repositories/product.repository.js';
import { importRepository } from '../repositories/import.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { Reseller, Product } from '../types/index.js';

export class ResellerController {
  private async resolveResellerId(req: AuthenticatedRequest): Promise<string | null> {
    if (req.user?.resellerId) {
      return req.user.resellerId;
    }

    if (req.user?.id) {
      const byUser = await resellerRepository.findByUserId(req.user.id);
      if (byUser) return byUser.id;
    }

    // Check query, header or param for resellerCode or subdomain
    const code = (req.query.resellerCode as string) || (req.headers['x-reseller-code'] as string) || (req.params.code as string);
    if (code) {
      const byCode = (await resellerRepository.findByCode(code)) || (await resellerRepository.findBySubdomain(code));
      if (byCode) {
        if (req.user?.role === 'ADMIN' || byCode.userId === req.user?.id || byCode.email === req.user?.email) {
          return byCode.id;
        }
      }
    }

    // If super admin is inspecting the platform without specifying, fallback to default seed reseller
    if (req.user?.role === 'ADMIN') {
      const defaultReseller = await resellerRepository.findByCode('comnet101');
      if (defaultReseller) return defaultReseller.id;
    }

    return null;
  }

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const metrics = await analyticsService.getResellerDashboardMetrics(resellerId);
    res.json({ success: true, data: metrics });
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    res.json({ success: true, data: reseller });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    // Mass-assignment protection: allowlist only safe editable profile fields (OWASP A01 Defense)
    const { businessName, displayName, phone, logo, address, businessInformation } = req.body;
    const safeUpdates: Partial<Reseller> = {};
    if (businessName !== undefined) safeUpdates.businessName = String(businessName).slice(0, 100);
    if (displayName !== undefined) safeUpdates.displayName = String(displayName).slice(0, 100);
    if (phone !== undefined) safeUpdates.phone = String(phone).slice(0, 30);
    if (logo !== undefined) safeUpdates.logo = String(logo).slice(0, 500);
    if (address !== undefined && typeof address === 'object') safeUpdates.address = address;
    if (businessInformation !== undefined && typeof businessInformation === 'object') {
      safeUpdates.businessInformation = {
        taxNumber: businessInformation.taxNumber ? String(businessInformation.taxNumber).slice(0, 50) : undefined,
        tradeLicense: businessInformation.tradeLicense ? String(businessInformation.tradeLicense).slice(0, 50) : undefined,
        website: businessInformation.website ? String(businessInformation.website).slice(0, 200) : undefined,
        description: businessInformation.description ? String(businessInformation.description).slice(0, 500) : undefined,
      };
    }

    const updated = await resellerService.updateResellerProfile(resellerId, safeUpdates);
    res.json({ success: true, data: updated });
  }

  async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const { status, search, page, limit } = req.query;
    const result = await productService.getProducts({
      resellerId,
      approvalStatus: status as any,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    res.json({ success: true, data: result.products, meta: result });
  }

  async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    const prod = await productService.createProduct({
      ...req.body,
      sellerType: 'RESELLER',
      resellerId,
      resellerCode: reseller?.resellerCode,
      resellerName: reseller?.displayName || reseller?.businessName,
      approvalStatus: 'PENDING_APPROVAL',
      isActive: false,
    });

    res.status(201).json({ success: true, data: prod });
  }

  async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Product does not belong to this reseller.' } });
      return;
    }

    const { name, description, categoryId, brandId, price, salePrice, stock, images, specs, tags, sku } = req.body;
    const safeUpdates: Partial<Product> = {
      ...(name !== undefined ? { name: String(name).slice(0, 200) } : {}),
      ...(description !== undefined ? { description: String(description).slice(0, 5000) } : {}),
      ...(categoryId !== undefined ? { categoryId: String(categoryId) } : {}),
      ...(brandId !== undefined ? { brandId: String(brandId) } : {}),
      ...(price !== undefined ? { price: Math.max(0, Number(price)) } : {}),
      ...(salePrice !== undefined ? { salePrice: Math.max(0, Number(salePrice)) } : {}),
      ...(stock !== undefined ? { stock: Math.max(0, Math.floor(Number(stock))) } : {}),
      ...(Array.isArray(images) ? { images } : {}),
      ...(specs && typeof specs === 'object' ? { specs } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(sku !== undefined ? { sku: String(sku).slice(0, 50) } : {}),
      isActive: false, // Edits unpublish the product until approved by admin
      approvalStatus: 'PENDING_APPROVAL',
    };

    const updated = await productService.updateProduct(id, safeUpdates);
    res.json({ success: true, data: updated });
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Product does not belong to this reseller.' } });
      return;
    }

    await productService.deleteProduct(id);
    res.json({ success: true, message: 'Product deleted successfully.' });
  }

  async updateInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;
    const { stock, lowStockThreshold } = req.body;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Product does not belong to this reseller.' } });
      return;
    }

    const updated = await productRepository.update(id, {
      stock: stock != null ? parseInt(stock, 10) : prod.stock,
      lowStockThreshold: lowStockThreshold != null ? parseInt(lowStockThreshold, 10) : prod.lowStockThreshold,
    });

    res.json({ success: true, data: updated });
  }

  async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const orders = await orderService.getOrdersByReseller(resellerId);
    res.json({ success: true, data: orders });
  }

  // Excel Product Import Engine
  async previewImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Excel file (.xlsx, .xls or .csv) is required.' } });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    try {
      const result = await excelImportService.parseAndValidateBuffer(
        file.buffer,
        resellerId,
        reseller?.resellerCode || 'reseller',
        file.originalname
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'EXCEL_PARSE_ERROR', message: err.message } });
    }
  }

  async executeImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const { reportId, products, duplicateAction } = req.body;
    if (!reportId || !products || !Array.isArray(products)) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid import payload.' } });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    const result = await excelImportService.executeImport(
      reportId,
      resellerId,
      reseller?.resellerCode || 'reseller',
      products,
      duplicateAction
    );

    res.json({ success: true, data: result });
  }

  async downloadTemplate(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const buffer = await excelImportService.generateSampleTemplateBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=nextech_hardware_sku_listing_template.xlsx');
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (err: any) {
      console.error('[ResellerController] Error generating Excel template:', err);
      res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: err.message || 'Failed to generate template' } });
    }
  }

  async getImportHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No associated reseller ID.' } });
      return;
    }

    const reports = await importRepository.findByResellerId(resellerId);
    res.json({ success: true, data: reports });
  }
}

export const resellerController = new ResellerController();
