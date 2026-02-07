import { Product, ProductVariant } from '@/types';

export const isVariantInStock = (variant?: ProductVariant | null): boolean => {
  if (!variant) return false;
  if (variant.stockQty === null || variant.stockQty === undefined) return true;
  return variant.stockQty > 0;
};

export const isVariantLowStock = (variant?: ProductVariant | null): boolean => {
  if (!variant) return false;
  if (variant.stockQty === null || variant.stockQty === undefined) return false;
  if (variant.lowStockThreshold === null || variant.lowStockThreshold === undefined) return false;
  return variant.stockQty <= variant.lowStockThreshold;
};

export const sortVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return [...variants].sort((a, b) => {
    const aOrder = a.sortOrder ?? 0;
    const bOrder = b.sortOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.price - b.price;
  });
};

export const getDefaultVariant = (variants: ProductVariant[]): ProductVariant | undefined => {
  if (!variants || variants.length === 0) return undefined;
  const active = variants.filter((v) => v.isActive !== false);
  const defaultVariant = active.find((v) => v.isDefault);
  return defaultVariant || active[0] || variants[0];
};

export const getVariantPrice = (product: Product, variant?: ProductVariant | null): number => {
  return variant?.price ?? product.basePrice;
};

export const getVariantOriginalPrice = (product: Product, variant?: ProductVariant | null): number | undefined => {
  return variant?.originalPrice ?? product.originalPrice;
};

export const getProductAvailability = (product: Product): boolean => {
  if (!product.isAvailable) return false;
  if (!product.variants || product.variants.length === 0) return product.isAvailable;
  return product.variants.some((v) => v.isActive !== false && isVariantInStock(v));
};
