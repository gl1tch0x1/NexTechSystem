import { productRepository } from "../repositories/product.repository.js";
import { Product } from "../types/index.js";
import { dbStore } from "../config/db-store.js";

export class InventoryService {
  async checkStock(
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<{
    available: boolean;
    currentStock: number;
    allowsBackorder?: boolean;
  }> {
    const product = await productRepository.findById(productId);
    if (!product) return { available: false, currentStock: 0 };

    // If inventory tracking is disabled or backorders are allowed, always available
    if (product.inventoryTracked === false || product.allowBackorder === true) {
      const stock =
        variantId && product.variants
          ? (product.variants.find((v) => v.id === variantId)?.stock ??
            product.stock)
          : product.stock;
      return {
        available: true,
        currentStock: stock,
        allowsBackorder: true,
      };
    }

    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return { available: false, currentStock: 0 };
      return {
        available: variant.stock >= quantity,
        currentStock: variant.stock,
      };
    }

    return {
      available: product.stock >= quantity,
      currentStock: product.stock,
    };
  }

  async deductStock(
    items: Array<{
      productId: string;
      quantity: number;
      variantId?: string;
      locationId?: string;
    }>,
  ): Promise<boolean> {
    return dbStore.runTransaction(async () => {
      // First pass: verify all items have sufficient stock (unless backorders allowed)
      for (const item of items) {
        const product = await productRepository.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const allowBackorder =
          product.allowBackorder === true || product.inventoryTracked === false;
        if (!allowBackorder) {
          if (
            item.variantId &&
            product.variants &&
            product.variants.length > 0
          ) {
            const variant = product.variants.find(
              (v) => v.id === item.variantId,
            );
            if (!variant || variant.stock < item.quantity) {
              throw new Error(
                `Insufficient inventory for variant "${variant?.title || item.variantId}" of "${product.name}". Only ${variant?.stock || 0} remaining.`,
              );
            }
          } else if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient inventory for product: ${product.name}. Only ${product.stock} remaining.`,
            );
          }
        }
      }

      // Second pass: decrement stock for variants, parent products, and locations
      for (const item of items) {
        const product = await productRepository.findById(item.productId);
        if (!product) continue;

        let newVariants = product.variants;
        let newTotalStock: number;

        if (item.variantId && product.variants && product.variants.length > 0) {
          newVariants = product.variants.map((v) => {
            if (v.id === item.variantId) {
              const updatedStock = Math.max(0, v.stock - item.quantity);
              return { ...v, stock: updatedStock };
            }
            return v;
          });
          newTotalStock = newVariants.reduce(
            (sum, v) => sum + (Number(v.stock) || 0),
            0,
          );
        } else {
          newTotalStock = Math.max(0, product.stock - item.quantity);
        }

        // Decrement location stock if locations exist
        let newLocations = product.locations;
        if (newLocations && newLocations.length > 0) {
          let targetLocation = item.locationId
            ? newLocations.find((l) => l.locationId === item.locationId)
            : newLocations.find(
                (l) => (l.available || l.quantity) >= item.quantity,
              ) || newLocations[0];

          if (targetLocation) {
            newLocations = newLocations.map((loc) => {
              if (loc.locationId === targetLocation!.locationId) {
                const avail = Math.max(
                  0,
                  (loc.available !== undefined ? loc.available : loc.quantity) -
                    item.quantity,
                );
                const onHand = Math.max(
                  0,
                  (loc.onHand !== undefined ? loc.onHand : loc.quantity) -
                    item.quantity,
                );
                return {
                  ...loc,
                  quantity: avail,
                  available: avail,
                  onHand,
                };
              }
              return loc;
            });
          }
        }

        const isOutOfStock = newTotalStock === 0 && !product.allowBackorder;

        await productRepository.update(product.id, {
          stock: newTotalStock,
          variants: newVariants,
          locations: newLocations,
          approvalStatus: isOutOfStock
            ? "OUT_OF_STOCK"
            : product.approvalStatus,
        });
      }

      return true;
    });
  }

  async restock(
    productId: string,
    quantity: number,
    variantId?: string,
    locationId?: string,
  ): Promise<Product | null> {
    const product = await productRepository.findById(productId);
    if (!product) return null;

    let newVariants = product.variants;
    let newTotalStock = product.stock + quantity;

    if (variantId && product.variants && product.variants.length > 0) {
      newVariants = product.variants.map((v) => {
        if (v.id === variantId) {
          return { ...v, stock: v.stock + quantity };
        }
        return v;
      });
      newTotalStock = newVariants.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0,
      );
    }

    let newLocations = product.locations;
    if (newLocations && newLocations.length > 0) {
      const locTarget = locationId
        ? newLocations.find((l) => l.locationId === locationId)
        : newLocations[0];

      if (locTarget) {
        newLocations = newLocations.map((loc) => {
          if (loc.locationId === locTarget.locationId) {
            const avail =
              (loc.available !== undefined ? loc.available : loc.quantity) +
              quantity;
            const onHand =
              (loc.onHand !== undefined ? loc.onHand : loc.quantity) + quantity;
            return {
              ...loc,
              quantity: avail,
              available: avail,
              onHand,
            };
          }
          return loc;
        });
      }
    }

    return productRepository.update(product.id, {
      stock: newTotalStock,
      variants: newVariants,
      locations: newLocations,
      approvalStatus:
        product.approvalStatus === "OUT_OF_STOCK" && newTotalStock > 0
          ? "ACTIVE"
          : product.approvalStatus,
    });
  }

  async getLowStockProducts(resellerId?: string): Promise<Product[]> {
    const products = resellerId
      ? await productRepository.findByResellerId(resellerId)
      : await productRepository.find();
    return products.filter(
      (p) => p.stock <= p.lowStockThreshold && p.stock > 0,
    );
  }

  async getOutOfStockProducts(resellerId?: string): Promise<Product[]> {
    const products = resellerId
      ? await productRepository.findByResellerId(resellerId)
      : await productRepository.find();
    return products.filter((p) => p.stock === 0 && !p.allowBackorder);
  }
}

export const inventoryService = new InventoryService();
