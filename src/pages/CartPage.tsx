import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, MessageCircle, 
  Send, Gift, Sparkles, Tag, AlertCircle 
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOffers } from '@/hooks/useOffers';
import { calculateCart } from '@/utils/offerCalculator';
import { DeliveryArea } from '@/types';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [selectedArea, setSelectedArea] = useState('');
  const [notes, setNotes] = useState('');
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'messenger'>('whatsapp');
  
  // جلب مناطق التوصيل والعروض
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const { offers, isLoading: isLoadingOffers } = useOffers();

  // جلب مناطق التوصيل من database
  useEffect(() => {
    const fetchDeliveryAreas = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_areas')
          .select('*')
          .eq('is_active', true)
          .order('city', { ascending: true })
          .order('area', { ascending: true });

        if (error) throw error;

        if (data) {
          setDeliveryAreas(
            data.map(area => ({
              id: area.id,
              city: area.city,
              area: area.area,
              deliveryFee: area.delivery_fee,
              deliveryTime: area.delivery_time || '',
              isActive: area.is_active,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching delivery areas:', error);
        toast.error('حدث خطأ في تحميل مناطق التوصيل');
      } finally {
        setIsLoadingAreas(false);
      }
    };

    fetchDeliveryAreas();
  }, []);

  // حساب السلة مع العروض
  const deliveryArea = deliveryAreas.find((a) => a.id === selectedArea);
  const originalDeliveryFee = deliveryArea?.deliveryFee || 0;
  
  const cartCalculation = calculateCart(items, offers, originalDeliveryFee);

  const whatsappNumber = '201276166532';

  const formatOrderMessage = () => {
    const productLines = items
      .map((item) => {
        const price = item.selectedSize?.price || item.product.basePrice;
        const lineTotal = price * item.quantity;
        return `- ${item.product.nameAr} - ${item.selectedSize?.label || item.product.unit} × ${item.quantity} = ${lineTotal} جنيه`;
      })
      .join('\n');

    // إضافة المنتجات المجانية
    let freeItemsText = '';
    cartCalculation.appliedOffers.forEach(applied => {
      if (applied.freeItems && applied.freeItems.length > 0) {
        applied.freeItems.forEach(freeItem => {
          freeItemsText += `\n🎁 ${freeItem.product.nameAr} × ${freeItem.quantity} (مجاناً!)`;
        });
      }
    });

    // إضافة العروض المطبقة
    const offersText = cartCalculation.appliedOffers.length > 0
      ? '\n\n*🎉 العروض المطبقة:*\n' + cartCalculation.appliedOffers.map(a => `- ${a.message}`).join('\n')
      : '';

    const message = `
🛒 *طلب جديد من متجر مذاق*

*📦 المنتجات:*
${productLines}${freeItemsText}

*📍 منطقة التوصيل:* ${deliveryArea ? `${deliveryArea.city} - ${deliveryArea.area}` : 'غير محدد'}
*🚚 رسوم التوصيل:* ${cartCalculation.deliveryFee} جنيه${cartCalculation.deliveryFee === 0 && originalDeliveryFee > 0 ? ' (مجاني 🎉)' : ''}

*💰 المجموع الفرعي:* ${cartCalculation.subtotal.toFixed(2)} جنيه
${cartCalculation.totalDiscount > 0 ? `*💚 إجمالي الخصم:* ${cartCalculation.totalDiscount.toFixed(2)} جنيه` : ''}
*💵 الإجمالي النهائي:* ${cartCalculation.total.toFixed(2)} جنيه
${cartCalculation.savings > 0 ? `\n✨ *وفرت:* ${cartCalculation.savings.toFixed(2)} جنيه` : ''}

*💳 طريقة الدفع:* الدفع عند الاستلام
${offersText}

${notes ? `\n*📝 ملاحظات:* ${notes}` : ''}

━━━━━━━━━━━━━━━━━━━━
_تاريخ الطلب: ${new Date().toLocaleDateString('ar-EG', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}_
    `.trim();

    return encodeURIComponent(message);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    if (!selectedArea) {
      toast.error('يرجى اختيار منطقة التوصيل');
      return;
    }

    const message = formatOrderMessage();

    if (contactMethod === 'whatsapp') {
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    } else {
      toast.info('خاصية الماسنجر قيد التطوير');
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="section-container py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h1>
            <p className="text-muted-foreground mb-8">
              لم تقم بإضافة أي منتجات إلى السلة بعد. تصفح منتجاتنا المميزة وابدأ التسوق الآن!
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              تصفح المنتجات
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span className="text-primary">سلة التسوق</span>
          </nav>
          <h1 className="text-3xl font-bold">سلة التسوق ({items.length} منتج)</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const price = item.selectedSize?.price || item.product.basePrice;
                const lineTotal = price * item.quantity;

                return (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize?.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl p-4 shadow-md flex gap-4"
                  >
                    {/* Image */}
                    <Link to={`/products/${item.product.id}`} className="shrink-0">
                      <img
                        src={item.product.mainImage}
                        alt={item.product.nameAr}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product.id}`}
                        className="font-bold text-lg hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.product.nameAr}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.product.categoryName}
                      </p>
                      <p className="text-sm text-primary-light mt-1">
                        {item.selectedSize?.label || item.product.unit} - {price} جنيه
                      </p>

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedSize?.id
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-muted disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedSize?.id
                              )
                            }
                            className="p-2 hover:bg-muted transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary text-lg">
                            {lineTotal.toFixed(2)} جنيه
                          </span>
                          <button
                            onClick={() =>
                              removeItem(item.product.id, item.selectedSize?.id)
                            }
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* المنتجات المجانية */}
            {cartCalculation.appliedOffers.some(offer => offer.freeItems && offer.freeItems.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-purple-900">🎉 منتجات مجانية!</h3>
                </div>
                <div className="space-y-3">
                  {cartCalculation.appliedOffers.map((applied, idx) => 
                    applied.freeItems?.map((freeItem, fIdx) => (
                      <div key={`${idx}-${fIdx}`} className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
                        <img
                          src={freeItem.product.mainImage}
                          alt={freeItem.product.nameAr}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-purple-900">{freeItem.product.nameAr}</p>
                          <p className="text-sm text-purple-600">الكمية: {freeItem.quantity}</p>
                        </div>
                        <span className="text-2xl">🎁</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Continue Shopping */}
            <div className="flex items-center justify-between pt-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                مواصلة التسوق
              </Link>
              <button
                onClick={() => {
                  clearCart();
                  toast.success('تم تفريغ السلة');
                }}
                className="text-destructive hover:underline text-sm"
              >
                تفريغ السلة
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-24 space-y-4">
              <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>

              {/* Subtotal */}
              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="font-medium">{cartCalculation.subtotal.toFixed(2)} جنيه</span>
              </div>

              {/* العروض المطبقة */}
              {cartCalculation.appliedOffers.length > 0 && (
                <div className="py-3 border-b space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>العروض المطبقة</span>
                  </div>
                  {cartCalculation.appliedOffers.map((applied, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Tag className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-foreground">{applied.message}</p>
                        <p className="text-green-600 font-semibold">
                          - {applied.discount.toFixed(2)} جنيه
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Area */}
              <div className="py-4 border-b">
                <label className="block text-sm font-medium mb-2">
                  منطقة التوصيل
                </label>
                {isLoadingAreas ? (
                  <div className="h-10 bg-muted animate-pulse rounded-xl" />
                ) : (
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="input-rtl py-2"
                  >
                    <option value="">اختر منطقة التوصيل</option>
                    {deliveryAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.city} - {area.area} ({area.deliveryFee} جنيه)
                      </option>
                    ))}
                  </select>
                )}
                
                {!isLoadingAreas && deliveryAreas.length === 0 && (
                  <p className="text-sm text-destructive mt-2">
                    لا توجد مناطق توصيل متاحة حالياً
                  </p>
                )}
              </div>

              {/* Delivery Fee */}
              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">رسوم التوصيل</span>
                <span className={`font-medium ${cartCalculation.deliveryFee === 0 && originalDeliveryFee > 0 ? 'text-green-600 line-through' : ''}`}>
                  {originalDeliveryFee > 0 && cartCalculation.deliveryFee === 0 ? (
                    <>
                      <span className="line-through text-muted-foreground">{originalDeliveryFee} جنيه</span>
                      <span className="text-green-600 font-bold mr-2">مجاني 🎉</span>
                    </>
                  ) : (
                    `${cartCalculation.deliveryFee} جنيه`
                  )}
                </span>
              </div>

              {/* Total Savings */}
              {cartCalculation.savings > 0 && (
                <div className="flex justify-between py-3 bg-green-50 -mx-6 px-6 rounded-lg">
                  <span className="text-green-700 font-semibold">✨ إجمالي التوفير</span>
                  <span className="text-green-700 font-bold text-lg">
                    {cartCalculation.savings.toFixed(2)} جنيه
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between py-4 border-t-2">
                <span className="text-lg font-bold">الإجمالي النهائي</span>
                <span className="text-2xl font-bold text-primary">
                  {cartCalculation.total.toFixed(2)} جنيه
                </span>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: التوصيل بعد الساعة ٦ مساءً"
                  className="input-rtl resize-none h-20"
                />
              </div>

              {/* Contact Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  طريقة التواصل
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setContactMethod('whatsapp')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      contactMethod === 'whatsapp'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border hover:border-success'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    واتساب
                  </button>
                  <button
                    onClick={() => setContactMethod('messenger')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      contactMethod === 'messenger'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-border hover:border-blue-500'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    ماسنجر
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={!selectedArea || isLoadingAreas}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contactMethod === 'whatsapp' ? (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    إتمام الطلب عبر واتساب
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    إتمام الطلب عبر ماسنجر
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                💳 الدفع عند الاستلام
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;