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
  featuredOrder?: number | null;
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

// User Profile & Address Types
export interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at?: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  city: string;
  area: string;
  street: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  is_default: boolean;
  created_at?: string;
}

export type Profile = UserProfile;
export type Address = UserAddress;

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

export interface OfferUI {
  id: string;
  titleAr: string;
  description: string | null;
  type: OfferType;
  discountPercentage: number | null;
  discountAmount: number | null;
  minQuantity: number | null;
  freeQuantity: number | null;
  minAmount: number | null;
  applicableProducts: string[] | null;
  applicableCategories: string[] | null;
  bannerImage: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  priority: number;
  autoApply: boolean;
  createdAt: Date;
  updatedAt: Date;
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

// Admin Orders (Supabase)
export type AdminOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface AdminOrderItem {
  id: string;
  product_name: string;
  size_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminOrder {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  status: AdminOrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_number: string | null;
  order_items?: AdminOrderItem[];
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

// --- WhatsApp Tracking + Analytics Types ---
export type WhatsAppEventType =
  | 'whatsapp_button_clicked'
  | 'whatsapp_window_opened'
  | 'user_returned_from_whatsapp'
  | 'message_likely_sent'
  | 'whatsapp_abandoned';

export interface OrderEvent {
  id: string;
  order_id: string;
  user_id: string | null;
  event_type: WhatsAppEventType | string;
  source: 'web' | 'admin' | 'system' | string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface OrdersAnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrdersFunnelMetrics {
  cartCheckoutStarted: number;
  whatsappOpened: number;
  whatsappLikelySent: number;
  confirmedOrders: number;
  conversionRate: number;
  whatsappAbandonRate: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
