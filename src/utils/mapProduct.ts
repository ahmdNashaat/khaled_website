import { Product, ProductVariant } from '@/types';
import { getDefaultVariant, getProductAvailability, sortVariants } from '@/utils/productVariants';

export const mapVariantRow = (row: any): ProductVariant => ({
  id: row.id,
  label: row.label,
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  weightGrams: row.weight_grams ?? null,
  stockQty: row.stock_qty ?? null,
  lowStockThreshold: row.low_stock_threshold ?? null,
  isDefault: row.is_default ?? false,
  isActive: row.is_active ?? true,
  sortOrder: row.sort_order ?? 0,
});

export const mapProductRow = (row: any): Product => {
  const variants = sortVariants((row.product_variants || []).map(mapVariantRow));
  const defaultVariant = getDefaultVariant(variants);
  const basePrice = defaultVariant?.price ?? Number(row.base_price);
  const originalPrice = defaultVariant?.originalPrice ?? (row.original_price ? Number(row.original_price) : undefined);

  const product: Product = {
    id: row.id,
    nameAr: row.name_ar,
    slug: row.slug,
    categoryId: row.category_id || '',
    categoryName: (row.categories as any)?.name_ar || '',
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    basePrice,
    originalPrice,
    unit: row.unit,
    variants,
    mainImage: row.main_image || '',
    additionalImages: row.additional_images || [],
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    discountPercentage: row.discount_percentage || undefined,
    featuredOrder: row.featured_order ?? null,
  };

  return {
    ...product,
    isAvailable: getProductAvailability(product),
  };
};
