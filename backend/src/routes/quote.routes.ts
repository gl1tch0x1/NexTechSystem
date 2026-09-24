import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { quoteRepository } from "../repositories/quote.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { ebillService } from "../services/ebill.service.js";
import { auditService } from "../services/audit.service.js";
import { Quote, QuoteItem, Order, OrderItem, Address } from "../types/index.js";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  apiLimiter,
  adminLimiter,
} from "../middlewares/rate-limiter.middleware.js";

const router = Router();

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

// 1. Submit B2B Corporate Quotation Request (Public with rate limiter & input sanitization)
router.post(
  "/",
  apiLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        taxRegistrationNumber,
        tradeLicense,
        clientReference,
        paymentTerms,
        deliverySLA,
        taxTreatment,
        validityDays,
        discount: rawDiscount,
        shipping: rawShipping,
        items,
        notes,
      } = req.body;

      if (!companyName || !contactName || !contactEmail) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Company name, contact name, and official business email are required.",
          },
        });
        return;
      }

      const cleanEmail = String(contactEmail).trim();
      if (cleanEmail.length < 5 || cleanEmail.length > 254) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Please provide a valid corporate email address (maximum 254 characters).",
          },
        });
        return;
      }

      // W3C HTML5 compliant, linear-time O(n) email validation regex without polynomial backtracking
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(cleanEmail)) {
        res.status(400).json({
          success: false,
          error: { message: "Please provide a valid corporate email address." },
        });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "At least one hardware line item is required for corporate quotation.",
          },
        });
        return;
      }

      if (items.length > 50) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Maximum 50 line items allowed per single quotation request.",
          },
        });
        return;
      }

      const processedItems: QuoteItem[] = [];
      let subtotal = 0;

      for (const rawItem of items) {
        const qty = Math.min(
          500,
          Math.max(1, parseInt(rawItem.quantity, 10) || 1),
        );
        const unitPrice = Math.min(
          1000000,
          Math.max(0, parseFloat(rawItem.unitPrice) || 0),
        );
        const itemDisc = Math.min(
          unitPrice * qty,
          Math.max(0, parseFloat(rawItem.discount) || 0),
        );
        const lineSubtotal = Math.max(0, unitPrice * qty - itemDisc);

        subtotal += lineSubtotal;
        processedItems.push({
          productId: String(rawItem.productId || `PROD-${Date.now()}`).slice(
            0,
            64,
          ),
          productName: String(
            rawItem.productName || "Enterprise Hardware Component",
          ).slice(0, 150),
          sku: String(rawItem.sku || "SKU-GEN").slice(0, 64),
          unitPrice,
          quantity: qty,
          discount: itemDisc,
          subtotal: lineSubtotal,
          specifications: rawItem.specifications || {},
        });
      }

      const quoteDiscount = Math.max(0, parseFloat(rawDiscount) || 0);
      const isZeroRated =
        taxTreatment === "FREE_ZONE" ||
        taxTreatment === "EXPORT" ||
        taxTreatment === "EXEMPT";
      const vatRate = isZeroRated ? 0 : 0.05;
      const taxableAmount = Math.max(0, subtotal - quoteDiscount);
      const tax = isZeroRated
        ? 0
        : Math.round(taxableAmount * vatRate * 100) / 100;
      const shipping =
        rawShipping !== undefined
          ? Math.max(0, parseFloat(rawShipping) || 0)
          : subtotal > 5000
            ? 0
            : 150;
      const total = Math.max(
        0,
        Math.round((taxableAmount + tax + shipping) * 100) / 100,
      );

      const quoteId = uuidv4();
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const quoteNumber = `QTE-2026-${randomSuffix}`;

      const validDays = parseInt(validityDays, 10) || 30;
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validDays);

      const newQuote: Quote = {
        id: quoteId,
        quoteNumber,
        companyName: String(companyName).trim().slice(0, 100),
        contactName: String(contactName).trim().slice(0, 100),
        contactEmail: String(contactEmail).trim().toLowerCase().slice(0, 120),
        contactPhone: contactPhone
          ? String(contactPhone).trim().slice(0, 30)
          : undefined,
        tradeLicense: tradeLicense
          ? String(tradeLicense).trim().slice(0, 50)
          : undefined,
        taxRegistrationNumber: taxRegistrationNumber
          ? String(taxRegistrationNumber).trim().slice(0, 30)
          : undefined,
        clientReference: clientReference
          ? String(clientReference).trim().slice(0, 50)
          : undefined,
        paymentTerms: paymentTerms
          ? String(paymentTerms).trim().slice(0, 50)
          : "NET_30",
        deliverySLA: deliverySLA
          ? String(deliverySLA).trim().slice(0, 50)
          : "EX_STOCK",
        taxTreatment: taxTreatment
          ? String(taxTreatment).trim().slice(0, 50)
          : "STANDARD",
        items: processedItems,
        subtotal,
        discount: quoteDiscount,
        tax,
        shipping,
        total,
        currency: "AED",
        status: "PENDING_REVIEW",
        validUntil: validUntilDate.toISOString(),
        notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await quoteRepository.create(newQuote);

      res.status(201).json({
        success: true,
        data: saved,
        message: `Quotation request ${quoteNumber} submitted successfully. An enterprise account manager will review and confirm bulk pricing within 4 business hours.`,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          error: { message: err.message || "Failed to submit quote request." },
        });
    }
  },
);

// 2. Get All Quotes (Admin Only with Rate Limiter & RBAC - OWASP A01 Defense)
router.get(
  "/",
  adminLimiter,
  authenticate,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const quotes = await quoteRepository.findRecent(100);
      res.json({
        success: true,
        data: quotes,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          error: { message: err.message || "Failed to fetch quotes." },
        });
    }
  },
);

// 3. Get Single Quote (Admin Only - OWASP A01 Defense)
router.get(
  "/:id",
  adminLimiter,
  authenticate,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const quote = await quoteRepository.findById(id);
      if (!quote) {
        res
          .status(404)
          .json({ success: false, error: { message: "Quote not found." } });
        return;
      }
      res.json({ success: true, data: quote });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          error: { message: err.message || "Failed to fetch quote." },
        });
    }
  },
);

// 4. Update Quote (Admin Only - OWASP A01 Defense)
router.put(
  "/:id",
  adminLimiter,
  authenticate,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const existing = await quoteRepository.findById(id);
      if (!existing) {
        res
          .status(404)
          .json({ success: false, error: { message: "Quote not found." } });
        return;
      }

      const { status, items, discount, shipping, notes, validUntil } = req.body;

      let subtotal = existing.subtotal;
      let updatedItems = existing.items;

      if (items && Array.isArray(items)) {
        subtotal = 0;
        updatedItems = items.map((it: any) => {
          const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
          const unitPrice = Math.max(0, parseFloat(it.unitPrice) || 0);
          const lineDiscount = Math.max(0, parseFloat(it.discount) || 0);
          const lineSubtotal = Math.max(0, unitPrice * qty - lineDiscount);
          subtotal += lineSubtotal;
          return {
            productId: String(it.productId || "").slice(0, 64),
            productName: String(it.productName || "").slice(0, 150),
            sku: String(it.sku || "").slice(0, 64),
            unitPrice,
            quantity: qty,
            discount: lineDiscount,
            subtotal: lineSubtotal,
            specifications: it.specifications,
          };
        });
      }

      const quoteDiscount =
        discount !== undefined
          ? Math.max(0, parseFloat(discount) || 0)
          : existing.discount;
      const taxableAmount = Math.max(0, subtotal - quoteDiscount);
      const vatRate = 0.05;
      const tax = Math.round(taxableAmount * vatRate * 100) / 100;
      const shippingFee =
        shipping !== undefined
          ? Math.max(0, parseFloat(shipping) || 0)
          : existing.shipping;
      const total = Math.round((taxableAmount + tax + shippingFee) * 100) / 100;

      const updated = await quoteRepository.update(id, {
        status: status || existing.status,
        items: updatedItems,
        subtotal,
        discount: quoteDiscount,
        tax,
        shipping: shippingFee,
        total,
        notes:
          notes !== undefined ? String(notes).slice(0, 1000) : existing.notes,
        validUntil: validUntil || existing.validUntil,
        updatedAt: new Date().toISOString(),
      });

      try {
        await auditService.log({
          userId: req.user?.id || "admin",
          userEmail: req.user?.email || "admin@nextechsystems.ae",
          userRole: "ADMIN",
          action: "UPDATE_QUOTE",
          resource: "quotes",
          resourceId: id,
          details: {
            quoteNumber: existing.quoteNumber,
            status: status || existing.status,
            total,
          },
        });
      } catch {}

      res.json({
        success: true,
        data: updated,
        message: "Quote updated successfully.",
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          error: { message: err.message || "Failed to update quote." },
        });
    }
  },
);

// 5. One-Click Convert Quote to Verified Sales Order (Admin Only - OWASP A01 Defense)
router.post(
  "/:id/convert",
  adminLimiter,
  authenticate,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const quote = await quoteRepository.findById(id);
      if (!quote) {
        res
          .status(404)
          .json({ success: false, error: { message: "Quote not found." } });
        return;
      }

      if (quote.status === "CONVERTED") {
        res.status(400).json({
          success: false,
          error: {
            message: `This quotation was already converted to Order #${quote.convertedOrderId}.`,
          },
        });
        return;
      }

      const orderId = uuidv4();
      const orderNumber = `ORD-QTE-${quote.quoteNumber.replace("QTE-2026-", "")}`;

      const orderItems: OrderItem[] = quote.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        slug: it.sku.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        thumbnail:
          "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400",
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        discount: it.discount,
        subtotal: it.subtotal,
        sellerType: "ADMIN",
        warrantyMonths: 24,
        warrantyExpiry: new Date(
          Date.now() + 24 * 30.5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }));

      const corporateAddress: Address = {
        id: uuidv4(),
        fullName: quote.contactName,
        addressLine1: "Corporate Delivery Site / Site Office",
        city: "Dubai",
        state: "Dubai",
        postalCode: "00000",
        country: "United Arab Emirates",
        phone: quote.contactPhone || "+971 4 000 0000",
      };

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: "usr_b2b_corporate",
        customerName: `${quote.contactName} (${quote.companyName})`,
        customerEmail: quote.contactEmail,
        customerPhone: quote.contactPhone,
        items: orderItems,
        subtotal: quote.subtotal,
        discount: quote.discount,
        walletAmountUsed: 0,
        tax: quote.tax,
        taxRate: 5,
        shippingFee: quote.shipping,
        total: quote.total,
        currency: quote.currency || "AED",
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PENDING",
        orderStatus: "CONFIRMED",
        shippingAddress: corporateAddress,
        billingAddress: corporateAddress,
        notes: `Converted from Corporate Quote #${quote.quoteNumber}. TRN: ${quote.taxRegistrationNumber || "N/A"}. ${quote.notes || ""}`,
        statusHistory: [
          {
            status: "CONFIRMED",
            note: `Auto-generated from corporate quotation ${quote.quoteNumber}`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdOrder = await orderRepository.create(newOrder);

      // Auto-generate UAE FTA E-Bill
      try {
        const eBill = await ebillService.generateEBill(createdOrder);
        await orderRepository.update(createdOrder.id, { eBillId: eBill.id });
      } catch (eBillErr) {
        console.warn("EBill generation warning on quote conversion:", eBillErr);
      }

      // Update Quote status to CONVERTED
      const updatedQuote = await quoteRepository.update(quote.id, {
        status: "CONVERTED",
        convertedOrderId: createdOrder.orderNumber,
        updatedAt: new Date().toISOString(),
      });

      // Audit Log
      try {
        await auditService.log({
          userId: req.user?.id || "admin_super",
          userEmail: req.user?.email || "admin@nextechsystems.ae",
          userRole: "ADMIN",
          action: "CONVERT_QUOTE_TO_ORDER",
          resource: "quotes",
          resourceId: quote.id,
          details: {
            quoteNumber: quote.quoteNumber,
            orderNumber: createdOrder.orderNumber,
            total: createdOrder.total,
            company: quote.companyName,
          },
        });
      } catch {}

      res.json({
        success: true,
        data: {
          order: createdOrder,
          quote: updatedQuote,
        },
        message: `Quotation ${quote.quoteNumber} successfully converted to verified Sales Order ${createdOrder.orderNumber}!`,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          error: {
            message: err.message || "Failed to convert quote to order.",
          },
        });
    }
  },
);

export default router;
