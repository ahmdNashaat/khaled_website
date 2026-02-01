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
  | 'percentage'        // خصم نسبة مئوية
  | 'fixed'            // خصم قيمة ثابتة
  | 'bogo'             // اشتري واحد واحصل على الثاني
  | 'buy_x_get_y'      // اشتري X واحصل على Y مجاناً
  | 'free_shipping'    // شحن مجاني
  | 'category_discount' // خصم على قسم كامل
  | 'custom';          // عرض مخصص

export interface Offer {
  id: string;
  title_ar: string;
  description: string | null;
  type: OfferType;
  
  // خصومات
  discount_percentage: number | null;  // نسبة الخصم (0-100)
  discount_amount: number | null;      // قيمة الخصم الثابتة
  
  // Buy X Get Y
  min_quantity: number | null;         // الحد الأدنى للكمية
  free_quantity: number | null;        // عدد القطع المجانية
  
  // شحن مجاني
  min_amount: number | null;           // الحد الأدنى للمبلغ
  
  // تطبيق العرض على
  applicable_products: string[] | null;   // معرّفات المنتجات
  applicable_categories: string[] | null; // معرّفات الأقسام
  
  // إعدادات
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  auto_apply: boolean;                 // تطبيق تلقائي في السلة
  
  created_at: string;
  updated_at: string;
}

// نتيجة تطبيق العرض
export interface AppliedOffer {
  offer: Offer;
  discount: number;                    // قيمة الخصم المطبقة
  freeItems?: {                        // المنتجات المجانية
    product: Product;
    quantity: number;
  }[];
  message: string;                     // رسالة للعميل
}

// حساب السلة مع العروض
export interface CartCalculation {
  subtotal: number;                    // المجموع قبل الخصم
  deliveryFee: number;                 // رسوم التوصيل
  appliedOffers: AppliedOffer[];       // العروض المطبقة
  totalDiscount: number;               // إجمالي الخصم
  total: number;                       // الإجمالي النهائي
  savings: number;                     // المبلغ الموفّر
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
  | 'pending'       // انتظار التأكيد
  | 'confirmed'     // تأكّد
  | 'preparing'     // يُعدّ
  | 'out_for_delivery' // في الطريق
  | 'delivered';    // تم التوصيل

export type OrderContactMethod = 'whatsapp' | 'messenger';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedSize?: ProductSize;
  lineTotal: number;
}

export interface Order {
  id: string;                          // uuid فريد للطلب
  createdAt: string;                   // تاريخ إنشاء الطلب (ISO string)
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