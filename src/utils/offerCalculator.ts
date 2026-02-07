import { CartItem, Offer, AppliedOffer, Product, CartCalculation } from '@/types';

/**
 * فحص إذا كان العرض ساري حالياً
 */
export const isOfferValid = (offer: Offer): boolean => {
  if (!offer.is_active) return false;
  
  const now = new Date();
  
  if (offer.start_date) {
    const startDate = new Date(offer.start_date);
    if (now < startDate) return false;
  }
  
  if (offer.end_date) {
    const endDate = new Date(offer.end_date);
    if (now > endDate) return false;
  }
  
  return true;
};

/**
 * فحص إذا كان العرض ينطبق على منتج معين
 */
export const isOfferApplicableToProduct = (offer: Offer, productId: string, categoryId: string): boolean => {
  // إذا لم يحدد منتجات أو أقسام، العرض ينطبق على الكل
  if (!offer.applicable_products && !offer.applicable_categories) {
    return true;
  }
  
  // فحص المنتجات المحددة
  if (offer.applicable_products && offer.applicable_products.includes(productId)) {
    return true;
  }
  
  // فحص الأقسام المحددة
  if (offer.applicable_categories && offer.applicable_categories.includes(categoryId)) {
    return true;
  }
  
  return false;
};

/**
 * حساب خصم نسبة مئوية
 */
const calculatePercentageDiscount = (
  offer: Offer,
  items: CartItem[]
): AppliedOffer | null => {
  if (!offer.discount_percentage) return null;
  
  let totalDiscount = 0;
  
  // حساب الخصم على المنتجات المؤهلة فقط
  items.forEach(item => {
    if (isOfferApplicableToProduct(offer, item.product.id, item.product.categoryId)) {
      const itemPrice = item.selectedVariant?.price || item.product.basePrice;
      const itemTotal = itemPrice * item.quantity;
      totalDiscount += (itemTotal * offer.discount_percentage) / 100;
    }
  });
  
  if (totalDiscount === 0) return null;
  
  return {
    offer,
    discount: totalDiscount,
    message: `خصم ${offer.discount_percentage}% - وفرت ${totalDiscount.toFixed(2)} جنيه`,
  };
};

/**
 * حساب خصم قيمة ثابتة
 */
const calculateFixedDiscount = (
  offer: Offer,
  items: CartItem[]
): AppliedOffer | null => {
  if (!offer.discount_amount) return null;
  
  // فحص إذا كان في منتجات مؤهلة
  const hasApplicableProducts = items.some(item =>
    isOfferApplicableToProduct(offer, item.product.id, item.product.categoryId)
  );
  
  if (!hasApplicableProducts) return null;
  
  return {
    offer,
    discount: offer.discount_amount,
    message: `خصم ${offer.discount_amount} جنيه`,
  };
};

/**
 * حساب عرض Buy X Get Y
 */
const calculateBuyXGetY = (
  offer: Offer,
  items: CartItem[]
): AppliedOffer | null => {
  if (!offer.min_quantity || !offer.free_quantity) return null;
  
  const freeItems: AppliedOffer['freeItems'] = [];
  let totalDiscount = 0;
  
  items.forEach(item => {
    if (isOfferApplicableToProduct(offer, item.product.id, item.product.categoryId)) {
      // حساب عدد المجموعات المكتملة
      const completeSets = Math.floor(item.quantity / offer.min_quantity);
      
      if (completeSets > 0) {
        const freeQty = completeSets * offer.free_quantity;
        const itemPrice = item.selectedVariant?.price || item.product.basePrice;
        
        freeItems.push({
          product: item.product,
          quantity: freeQty,
        });
        
        totalDiscount += itemPrice * freeQty;
      }
    }
  });
  
  if (freeItems.length === 0) return null;
  
  return {
    offer,
    discount: totalDiscount,
    freeItems,
    message: `اشتري ${offer.min_quantity} واحصل على ${offer.free_quantity} مجاناً`,
  };
};

/**
 * حساب عرض BOGO
 */
const calculateBOGO = (
  offer: Offer,
  items: CartItem[]
): AppliedOffer | null => {
  const freeItems: AppliedOffer['freeItems'] = [];
  let totalDiscount = 0;
  
  items.forEach(item => {
    if (isOfferApplicableToProduct(offer, item.product.id, item.product.categoryId)) {
      // كل منتجين، واحد مجاني
      const freeQty = Math.floor(item.quantity / 2);
      
      if (freeQty > 0) {
        const itemPrice = item.selectedVariant?.price || item.product.basePrice;
        
        freeItems.push({
          product: item.product,
          quantity: freeQty,
        });
        
        totalDiscount += itemPrice * freeQty;
      }
    }
  });
  
  if (freeItems.length === 0) return null;
  
  return {
    offer,
    discount: totalDiscount,
    freeItems,
    message: 'اشتري واحد واحصل على الثاني مجاناً',
  };
};

/**
 * تطبيق عرض واحد على السلة
 */
const applyOffer = (offer: Offer, items: CartItem[]): AppliedOffer | null => {
  if (!isOfferValid(offer)) return null;
  
  switch (offer.type) {
    case 'percentage':
    case 'category_discount':
      return calculatePercentageDiscount(offer, items);
      
    case 'fixed':
      return calculateFixedDiscount(offer, items);
      
    case 'buy_x_get_y':
      return calculateBuyXGetY(offer, items);
      
    case 'bogo':
      return calculateBOGO(offer, items);
      
    default:
      return null;
  }
};

/**
 * حساب شحن مجاني
 */
export const calculateFreeShipping = (
  offers: Offer[],
  subtotal: number,
  originalDeliveryFee: number
): { isFree: boolean; offer?: Offer; message?: string } => {
  // البحث عن عرض شحن مجاني ساري
  const freeShippingOffer = offers.find(
    offer =>
      offer.type === 'free_shipping' &&
      isOfferValid(offer) &&
      offer.min_amount &&
      subtotal >= offer.min_amount
  );
  
  if (freeShippingOffer) {
    return {
      isFree: true,
      offer: freeShippingOffer,
      message: `🎉 توصيل مجاني! (وفرت ${originalDeliveryFee} جنيه)`,
    };
  }
  
  // حساب المبلغ المتبقي للشحن المجاني
  const nextFreeShippingOffer = offers.find(
    offer =>
      offer.type === 'free_shipping' &&
      isOfferValid(offer) &&
      offer.min_amount &&
      subtotal < offer.min_amount
  );
  
  if (nextFreeShippingOffer && nextFreeShippingOffer.min_amount) {
    const remaining = nextFreeShippingOffer.min_amount - subtotal;
    return {
      isFree: false,
      message: `أضف ${remaining.toFixed(2)} جنيه للحصول على توصيل مجاني`,
    };
  }
  
  return { isFree: false };
};

/**
 * حساب السلة الكاملة مع جميع العروض
 */
export const calculateCart = (
  items: CartItem[],
  offers: Offer[],
  deliveryFee: number
): CartCalculation => {
  // حساب المجموع الفرعي
  const subtotal = items.reduce((total, item) => {
    const price = item.selectedVariant?.price || item.product.basePrice;
    return total + price * item.quantity;
  }, 0);
  
  // فلترة العروض السارية والقابلة للتطبيق التلقائي
  const validOffers = offers.filter(offer => 
    isOfferValid(offer) && 
    offer.auto_apply && 
    offer.type !== 'free_shipping'
  );
  
  // تطبيق العروض وترتيبها حسب الأولوية
  const appliedOffers: AppliedOffer[] = validOffers
    .map(offer => applyOffer(offer, items))
    .filter((result): result is AppliedOffer => result !== null)
    .sort((a, b) => b.offer.priority - a.offer.priority);
  
  // حساب إجمالي الخصم
  const totalDiscount = appliedOffers.reduce((sum, applied) => sum + applied.discount, 0);
  
  // حساب الشحن المجاني
  const freeShipping = calculateFreeShipping(offers, subtotal, deliveryFee);
  const finalDeliveryFee = freeShipping.isFree ? 0 : deliveryFee;
  
  // إضافة خصم الشحن المجاني للعروض المطبقة
  if (freeShipping.isFree && freeShipping.offer) {
    appliedOffers.push({
      offer: freeShipping.offer,
      discount: deliveryFee,
      message: freeShipping.message || 'توصيل مجاني',
    });
  }
  
  // الإجمالي النهائي
  const total = subtotal - totalDiscount + finalDeliveryFee;
  
  return {
    subtotal,
    deliveryFee: finalDeliveryFee,
    appliedOffers,
    totalDiscount: totalDiscount + (freeShipping.isFree ? deliveryFee : 0),
    total: Math.max(0, total),
    savings: totalDiscount + (freeShipping.isFree ? deliveryFee : 0),
  };
};

/**
 * الحصول على أفضل عرض لمنتج معين
 */
export const getBestOfferForProduct = (
  product: Product,
  offers: Offer[]
): Offer | null => {
  const applicableOffers = offers.filter(
    offer =>
      isOfferValid(offer) &&
      isOfferApplicableToProduct(offer, product.id, product.categoryId)
  );
  
  if (applicableOffers.length === 0) return null;
  
  // ترتيب حسب الأولوية
  return applicableOffers.sort((a, b) => b.priority - a.priority)[0];
};
