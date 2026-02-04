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

// Advanced Offer Types
export type OfferType =
  | 'percentage'
  | 'fixed'
  | 'bogo'
  | 'buy_x_get_y'
  | 'free_shipping'
  | 'category_discount'
  | 'custom';

export interface Offer {
  id: string;
  title_ar: string;
  description: string | null;
  type: OfferType;
  discount_percentage: number | null;
  discount_amount: number | null;
  min_quantity: number | null;
  free_quantity: number | null;
  min_amount: number | null;
  applicable_products: string[] | null;
  applicable_categories: string[] | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  auto_apply: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppliedOffer {
  offer: Offer;
  discount: number;
  freeItems?: {
    product: Product;
    quantity: number;
  }[];
  message: string;
}

export interface CartCalculation {
  subtotal: number;
  deliveryFee: number;
  appliedOffers: AppliedOffer[];
  totalDiscount: number;
  total: number;
  savings: number;
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

// ─── Order Types ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';


export type OrderContactMethod = 'whatsapp' | 'messenger';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedSize?: ProductSize;
  lineTotal: number;
}

export interface Order {
  id: string;                          // local unique id
  orderNumber: string;                // human-readable order number
  supabaseOrderId: string | null;      // الـ id من Supabase (نربطهم)
  userId?: string | null;
  createdAt: string;
  status: OrderStatus;
  contactMethod: OrderContactMethod;
  items: OrderItem[];
  deliveryArea: {
    city: string;
    area: string;
  } | null;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  totalDiscount: number;
  total: number;
  savings: number;
  appliedOffers: {
    offerTitle: string;
    discount: number;
    message: string;
  }[];
}

export type NotificationType =
  | 'order_status_change'
  | 'new_order'
  | 'order_cancelled'
  | 'promotion';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  order_id: string | null;
  order_number: string | null;
  is_read: boolean;
  created_at: string;
  metadata: {
    old_status?: string;
    new_status?: string;
    customer_name?: string;
    total?: number;
    [key: string]: any;
  } | null;
}
