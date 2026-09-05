import { productRepository } from '../repositories/product.repository.js';
import { Product } from '../types/index.js';
import { dbStore } from '../config/db-store.js';

export class InventoryService {
  async checkStock(productId: string, quantity: number): Promise<{ available: boolean; currentStock: number }> {
    const product = await productRepository.findById(productId);
    if (!product) return { available: false, currentStock: 0 };
    return {
      available: product.stock >= quantity,
      currentStock: product.stock,
    };
  }

  async deductStock(items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    return dbStore.runTransaction(async () => {
      // First pass: verify all items have sufficient stock
      for (const item of items) {
        const product = await productRepository.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient inventory for product: ${product?.name || item.productId}`);
        }
      }

      // Second pass: decrement stock
      for (const item of items) {
        const product = await productRepository.findById(item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          const isOutOfStock = newStock === 0;
          await productRepository.update(product.id, {
            stock: newStock,
            approvalStatus: isOutOfStock ? 'OUT_OF_STOCK' : product.approvalStatus,
          });
        }
      }

      return true;
    });
  }

  async restock(productId: string, quantity: number): Promise<Product | null> {
    const product = await productRepository.findById(productId);
    if (!product) return null;
    const newStock = product.stock + quantity;
    return productRepository.update(product.id, {
      stock: newStock,
      approvalStatus: product.approvalStatus === 'OUT_OF_STOCK' && newStock > 0 ? 'ACTIVE' : product.approvalStatus,
    });
  }

  async getLowStockProducts(resellerId?: string): Promise<Product[]> {
    const products = resellerId
      ? await productRepository.findByResellerId(resellerId)
      : await productRepository.find();
    return products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
  }

  async getOutOfStockProducts(resellerId?: string): Promise<Product[]> {
    const products = resellerId
      ? await productRepository.findByResellerId(resellerId)
      : await productRepository.find();
    return products.filter(p => p.stock === 0);
  }
}

export const inventoryService = new InventoryService();
