import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analytics.service.js';
import { productService } from '../services/product.service.js';
import { resellerService } from '../services/reseller.service.js';
import { orderService } from '../services/order.service.js';
import { inventoryService } from '../services/inventory.service.js';
import { excelImportService } from '../services/excel-import.service.js';
import { productRepository } from '../repositories/product.repository.js';
import { importRepository } from '../repositories/import.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';

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

    const updated = await resellerService.updateResellerProfile(resellerId, req.body);
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

    const updated = await productService.updateProduct(id, {
      ...req.body,
      approvalStatus: 'PENDING_APPROVAL', // Edits require re-approval
    });

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
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Excel file (.xlsx or .csv) is required.' } });
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

  async downloadTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const buffer = excelImportService.generateSampleTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=comnet_technology_listing_template.xlsx');
    res.send(buffer);
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
