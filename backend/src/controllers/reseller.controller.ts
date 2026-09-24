import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { analyticsService } from "../services/analytics.service.js";
import { productService } from "../services/product.service.js";
import { resellerService } from "../services/reseller.service.js";
import { orderService } from "../services/order.service.js";
import { inventoryService } from "../services/inventory.service.js";
import { excelImportService } from "../services/excel-import.service.js";
import { productRepository } from "../repositories/product.repository.js";
import { importRepository } from "../repositories/import.repository.js";
import { resellerRepository } from "../repositories/reseller.repository.js";

const EDITABLE_PRODUCT_FIELDS = [
  "name",
  "title",
  "slug",
  "sku",
  "barcode",
  "shortDescription",
  "description",
  "price",
  "salePrice",
  "originalPrice",
  "compareAtPrice",
  "costPrice",
  "currency",
  "stock",
  "lowStockThreshold",
  "categoryId",
  "categoryName",
  "brandId",
  "brandName",
  "images",
  "thumbnail",
  "primaryImage",
  "specifications",
  "specs",
  "features",
  "tags",
  "collections",
  "warranty",
  "hasVariants",
  "variantOptions",
  "variants",
  "weight",
  "dimensions",
  "hsCode",
  "isPhysical",
  "chargeTax",
  "unitPrice",
  "unitMeasure",
  "inventoryTracked",
  "allowBackorder",
  "locations",
  "discountPercentage",
] as const;

function editableProduct(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    EDITABLE_PRODUCT_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(input, field),
    ).map((field) => [field, input[field]]),
  );
}

export class ResellerController {
  private async resolveResellerId(
    req: AuthenticatedRequest,
  ): Promise<string | null> {
    if (req.user?.resellerId) {
      const requestedCode = String(
        req.query.resellerCode || req.headers["x-reseller-code"] || "",
      ).toLowerCase();
      if (requestedCode) {
        const ownReseller = await resellerRepository.findById(
          req.user.resellerId,
        );
        if (
          !ownReseller ||
          (ownReseller.resellerCode.toLowerCase() !== requestedCode &&
            ownReseller.subdomain.toLowerCase() !== requestedCode)
        ) {
          return null;
        }
      }
      return req.user.resellerId;
    }

    if (req.user?.id) {
      const byUser = await resellerRepository.findByUserId(req.user.id);
      if (byUser) {
        const requestedCode = String(
          req.query.resellerCode || req.headers["x-reseller-code"] || "",
        ).toLowerCase();
        if (
          !requestedCode ||
          requestedCode === byUser.resellerCode.toLowerCase() ||
          requestedCode === byUser.subdomain.toLowerCase()
        )
          return byUser.id;
        return null;
      }
    }

    // Check query, header or param for resellerCode or subdomain
    const code =
      (req.query.resellerCode as string) ||
      (req.headers["x-reseller-code"] as string) ||
      (req.params.code as string);
    if (code) {
      const byCode =
        (await resellerRepository.findByCode(code)) ||
        (await resellerRepository.findBySubdomain(code));
      if (byCode) {
        if (
          req.user?.role === "ADMIN" ||
          byCode.userId === req.user?.id ||
          byCode.email === req.user?.email
        ) {
          return byCode.id;
        }
      }
    }

    // If super admin is inspecting the platform without specifying, fallback to default seed reseller
    if (req.user?.role === "ADMIN") {
      const defaultReseller = await resellerRepository.findByCode("comnet101");
      if (defaultReseller) return defaultReseller.id;
    }

    return null;
  }

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const metrics =
      await analyticsService.getResellerDashboardMetrics(resellerId);
    res.json({ success: true, data: metrics });
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    res.json({ success: true, data: reseller });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const input = req.body || {};
    const changes = Object.fromEntries(
      ["displayName", "phone", "logo", "address"]
        .filter((field) => Object.prototype.hasOwnProperty.call(input, field))
        .map((field) => [field, input[field]]),
    );
    const updated = await resellerService.updateResellerProfile(
      resellerId,
      changes,
    );
    res.json({ success: true, data: updated });
  }

  async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
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
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const input = editableProduct(req.body || {});
    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      typeof input.sku !== "string" ||
      !input.sku.trim() ||
      typeof input.categoryId !== "string" ||
      !input.categoryId ||
      typeof input.brandId !== "string" ||
      !input.brandId ||
      typeof input.description !== "string" ||
      !input.description.trim() ||
      typeof input.price !== "number" ||
      !Number.isFinite(input.price) ||
      input.price <= 0 ||
      typeof input.stock !== "number"
    ) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_PRODUCT",
            message:
              "Name, unique SKU, full description, category, brand, positive price, and stock are required.",
          },
        });
      return;
    }
    try {
      const reseller = await resellerService.getResellerById(resellerId);
      const prod = await productService.createProduct({
        ...input,
        sellerType: "RESELLER",
        resellerId,
        resellerCode: reseller?.resellerCode,
        resellerName: reseller?.displayName || reseller?.businessName,
        approvalStatus: "PENDING_APPROVAL",
        isActive: false,
      } as any);
      res.status(201).json({ success: true, data: prod });
    } catch (err: any) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_PRODUCT",
            message: err.message || "Unable to create SKU.",
          },
        });
    }
  }

  async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Product does not belong to this reseller.",
          },
        });
      return;
    }

    try {
      const changes = editableProduct(req.body || {});
      if (
        (changes.description !== undefined &&
          (typeof changes.description !== "string" ||
            !changes.description.trim())) ||
        (changes.price !== undefined &&
          (typeof changes.price !== "number" ||
            !Number.isFinite(changes.price) ||
            changes.price <= 0))
      ) {
        res
          .status(400)
          .json({
            success: false,
            error: {
              code: "INVALID_PRODUCT",
              message: "A full description and positive price are required.",
            },
          });
        return;
      }
      const updated = await productService.updateProduct(id, {
        ...changes,
        approvalStatus: "PENDING_APPROVAL",
        isActive: false,
        rejectionReason: "",
      } as any);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "INVALID_PRODUCT",
            message: err.message || "Unable to update SKU.",
          },
        });
    }
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Product does not belong to this reseller.",
          },
        });
      return;
    }

    await productService.deleteProduct(id);
    res.json({ success: true, message: "Product deleted successfully." });
  }

  async updateInventory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    const id = req.params.id as string;
    const { stock, lowStockThreshold } = req.body;

    const prod = await productRepository.findById(id);
    if (!prod || prod.resellerId !== resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Product does not belong to this reseller.",
          },
        });
      return;
    }

    const nextStock = stock == null ? prod.stock : Number(stock);
    const nextThreshold =
      lowStockThreshold == null
        ? prod.lowStockThreshold
        : Number(lowStockThreshold);
    if (
      !Number.isInteger(nextStock) ||
      nextStock < 0 ||
      !Number.isInteger(nextThreshold) ||
      nextThreshold < 0
    ) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Stock and alert threshold must be non-negative whole numbers.",
          },
        });
      return;
    }
    const updated = await productRepository.update(id, {
      stock: nextStock,
      lowStockThreshold: nextThreshold,
    });

    res.json({ success: true, data: updated });
  }

  async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const orders = await orderService.getOrdersByReseller(resellerId);
    res.json({
      success: true,
      data: orders.map((order) => {
        const items = order.items.filter(
          (item) => item.resellerId === resellerId,
        );
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          items,
          resellerTotal:
            Math.round(
              items.reduce((sum, item) => sum + item.subtotal, 0) * 100,
            ) / 100,
        };
      }),
    });
  }

  // Excel Product Import Engine
  async previewImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const file = req.file;
    if (!file) {
      res
        .status(400)
        .json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Excel file (.xlsx or .csv) is required.",
          },
        });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    try {
      const result = await excelImportService.parseAndValidateBuffer(
        file.buffer,
        resellerId,
        reseller?.resellerCode || "reseller",
        file.originalname,
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      res
        .status(400)
        .json({
          success: false,
          error: { code: "EXCEL_PARSE_ERROR", message: err.message },
        });
    }
  }

  async executeImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const { reportId, products, duplicateAction } = req.body;
    if (!reportId || !products || !Array.isArray(products)) {
      res
        .status(400)
        .json({
          success: false,
          error: { code: "BAD_REQUEST", message: "Invalid import payload." },
        });
      return;
    }

    const reseller = await resellerService.getResellerById(resellerId);
    const result = await excelImportService.executeImport(
      reportId,
      resellerId,
      reseller?.resellerCode || "reseller",
      products,
      duplicateAction,
    );

    res.json({ success: true, data: result });
  }

  async downloadTemplate(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const buffer = await excelImportService.generateSampleTemplateBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=comnet_technology_listing_template.xlsx",
    );
    res.send(buffer);
  }

  async getImportHistory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const resellerId = await this.resolveResellerId(req);
    if (!resellerId) {
      res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "No associated reseller ID." },
        });
      return;
    }

    const reports = await importRepository.findByResellerId(resellerId);
    res.json({ success: true, data: reports });
  }
}

export const resellerController = new ResellerController();
