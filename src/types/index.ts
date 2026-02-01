// Product Types
export interface ProductSize {
  id: string;
  label: string;
  price: number;
}

export interface Product {
  id: string;
  nameAr: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  fullDescription: string;
  basePrice: number;
  originalPrice?: number;
  unit: string;
  sizes: ProductSize[];
  mainImage: string;
  additionalImages: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  discountPercentage?: number;
}

// Category Types
export interface Category {
  id: string;
  nameAr: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  order: number;
  productsCount: number;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: ProductSize;
}

// Delivery Area Types
export interface DeliveryArea {
  id: string;
  city: string;
  area: string;
  deliveryFee: number;
  deliveryTime: string;
  isActive: boolean;
}

// Offer Types
export interface Offer {
  id: string;
  titleAr: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'custom' | 'free_shipping';
  discountPercentage?: number;
  discountAmount?: number;
  bannerImage: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
}

// Store Settings Types
export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  shortDescription: string;
  about: string;
  address?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber: string;
  messengerUrl?: string;
}
