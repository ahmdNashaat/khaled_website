import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, MessageCircle,
  Gift, Sparkles, Tag, Loader2, User, Phone, MapPin
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCartStore } from '@/store/cartStore';
import { useOrdersStore } from '@/store/ordersStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOffers } from '@/hooks/useOffers';
import { calculateCart } from '@/utils/offerCalculator';
import { saveOrderToSupabase } from '@/utils/saveOrder';
import { formatOrderNumber } from '@/utils/orderNumber';
import { DeliveryArea, UserAddress } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddressBook from '@/components/AddressBook';
import { z } from 'zod';
import { useWhatsAppTracking } from '@/hooks/useWhatsAppTracking';

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'الاسم الكامل مطلوب').max(100),
  customerPhone: z.string().min(8, 'رقم الهاتف غير صالح').max(20),
  city: z.string().min(2, 'المدينة مطلوبة').max(100),
  area: z.string().min(2, 'المنطقة مطلوبة').max(100),
  street: z.string().min(2, 'الشارع مطلوب').max(200),
});

type AddressForm = {
  city: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
};

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const createOrder = useOrdersStore((state) => state.createOrder);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressForm, setAddressForm] = useState<AddressForm>({
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
  });

  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const { offers, isLoading: isLoadingOffers } = useOffers();
  const { startTracking } = useWhatsAppTracking();

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

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCustomerName((prev) => prev || data.full_name || '');
          setCustomerPhone((prev) => prev || data.phone || '');
        } else {
          setCustomerName((prev) => prev || user.user_metadata?.full_name || '');
          setCustomerPhone((prev) => prev || user.user_metadata?.phone || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSelectAddress = (address: UserAddress | null) => {
    if (!address) {
      setSelectedAddressId(null);
      return;
    }

    setSelectedAddressId(address.id);
    setAddressForm({
      city: address.city,
      area: address.area,
      street: address.street,
      building: address.building || '',
      floor: address.floor || '',
      apartment: address.apartment || '',
    });

    const matchedArea = deliveryAreas.find(
      (area) => area.city === address.city && area.area === address.area
    );
    if (matchedArea) {
      setSelectedArea(matchedArea.id);
    } else {
      setSelectedArea('');
      toast.error('منطقة التوصيل لهذا العنوان غير متاحة حالياً');
    }
  };

  const handleAddressesChange = (nextAddresses: UserAddress[]) => {
    setAddresses(nextAddresses);
    if (!selectedAddressId) {
      const preferred = nextAddresses.find((a) => a.is_default) || nextAddresses[0];
      if (preferred) {
        handleSelectAddress(preferred);
      }
    }
  };

  useEffect(() => {
    if (!selectedAddressId) return;
    const address = addresses.find((addr) => addr.id === selectedAddressId);
    if (!address || deliveryAreas.length === 0) return;
    const matchedArea = deliveryAreas.find(
      (area) => area.city === address.city && area.area === address.area
    );
    if (matchedArea) {
      setSelectedArea(matchedArea.id);
    }
  }, [selectedAddressId, deliveryAreas, addresses]);

  const deliveryArea = deliveryAreas.find((a) => a.id === selectedArea);
  const originalDeliveryFee = deliveryArea?.deliveryFee || 0;
  const cartCalculation = calculateCart(items, offers, originalDeliveryFee);

  const whatsappNumber = '201276166532';

  const formatOrderMessage = (orderNumber?: string) => {
    const productLines = items
      .map((item) => {
        const price = item.selectedSize?.price || item.product.basePrice;
        const lineTotal = price * item.quantity;
        return `- ${item.product.nameAr} - ${item.selectedSize?.label || item.product.unit} × ${item.quantity} = ${lineTotal} جنيه`;
      })
      .join('\n');

    let freeItemsText = '';
    cartCalculation.appliedOffers.forEach(applied => {
      if (applied.freeItems && applied.freeItems.length > 0) {
        applied.freeItems.forEach(freeItem => {
          freeItemsText += `\n🎁 ${freeItem.product.nameAr} × ${freeItem.quantity} (مجاناً!)`;
        });
      }
    });

    const offersText = cartCalculation.appliedOffers.length > 0
      ? '\n\n*🎉 العروض المطبقة:*\n' + cartCalculation.appliedOffers.map(a => `- ${a.message}`).join('\n')
      : '';

    const message = `
🛒 *طلب جديد من متجر مذاق*
${orderNumber ? `\n*🔖 رقم الطلب:* ${formatOrderNumber(orderNumber)}` : ''}

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

  const buildCustomerAddress = (address: AddressForm) => {
    const parts = [
      `${address.city} - ${address.area}`,
      address.street,
      address.building ? `عمارة ${address.building}` : null,
      address.floor ? `الدور ${address.floor}` : null,
      address.apartment ? `شقة ${address.apartment}` : null,
    ];
    return parts.filter(Boolean).join('، ');
  };

  // ─── Checkout: save first, then open WhatsApp ────────────────────────────
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    if (!selectedArea) {
      toast.error('يرجى اختيار منطقة التوصيل');
      return;
    }
    const parsed = checkoutSchema.safeParse({
      customerName,
      customerPhone,
      city: addressForm.city,
      area: addressForm.area,
      street: addressForm.street,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'يرجى استكمال بيانات العميل');
      return;
    }

    setIsSending(true);

    try {
      const customerAddress = buildCustomerAddress(addressForm);
      // 1. حفظ في Supabase – لو فشل نوقف هنا فعلاً
      const { orderId: supabaseOrderId, orderNumber } = await saveOrderToSupabase({
        items,
        deliveryArea,
        notes,
        subtotal: cartCalculation.subtotal,
        deliveryFee: cartCalculation.deliveryFee,
        totalDiscount: cartCalculation.totalDiscount,
        total: cartCalculation.total,
        appliedOffers: cartCalculation.appliedOffers,
        userId: user?.id ?? null,
        customerName,
        customerPhone,
        customerAddress,
        customerCity: addressForm.city,
      });

      // 2. حفظ محلياً في localStorage
      const localOrder = createOrder({
        items,
        deliveryArea,
        notes,
        contactMethod: 'whatsapp',
        subtotal: cartCalculation.subtotal,
        deliveryFee: cartCalculation.deliveryFee,
        totalDiscount: cartCalculation.totalDiscount,
        total: cartCalculation.total,
        savings: cartCalculation.savings,
        appliedOffers: cartCalculation.appliedOffers,
        supabaseOrderId,
        orderNumber,
        userId: user?.id ?? null,
      });

      // 3. Track WhatsApp funnel events (best-effort)
      void startTracking(supabaseOrderId, user?.id ?? null);

      // 4. فتح واتساب بعد الحفظ الناجح فقط
      const message = formatOrderMessage(orderNumber);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');

      // 5. تفريغ السلة
      clearCart();

      // 6. navigate للـ confirmation
      navigate(`/orders/${localOrder.id}`);

    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('حدث خطأ في حفظ الطلب، حاول مرة تانية');
    } finally {
      setIsSending(false);
    }
  };

  // ─── Empty cart ───────────────────────────────────────────────────────────
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

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="section-container py-8">
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
                    <Link to={`/products/${item.product.id}`} className="shrink-0">
                      <img
                        src={item.product.mainImage}
                        alt={item.product.nameAr}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                    </Link>

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

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize?.id)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-muted disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize?.id)}
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
                            onClick={() => removeItem(item.product.id, item.selectedSize?.id)}
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

            <div className="flex items-center justify-between pt-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                مواصلة التسوق
              </Link>
              <button
                onClick={() => { clearCart(); toast.success('تم تفريغ السلة'); }}
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

              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="font-medium">{cartCalculation.subtotal.toFixed(2)} جنيه</span>
              </div>

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
                        <p className="text-green-600 font-semibold">- {applied.discount.toFixed(2)} جنيه</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="py-4 border-b space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <User className="w-4 h-4" />
                  <span>بيانات العميل</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أدخل اسمك"
                      disabled={isProfileLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="مثال: 01000000000"
                      dir="ltr"
                      disabled={isProfileLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="py-4 border-b space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>عنوان التوصيل</span>
                </div>

                {user && (
                  <AddressBook
                    userId={user.id}
                    mode="select"
                    selectedAddressId={selectedAddressId}
                    onSelect={handleSelectAddress}
                    onAddressesChange={handleAddressesChange}
                  />
                )}

                <div className="rounded-xl border p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    يمكنك تعديل العنوان هنا دون حفظه في دفتر العناوين.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المنطقة</Label>
                      <Input
                        value={addressForm.area}
                        onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>الشارع</Label>
                    <Input
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>العمارة</Label>
                      <Input
                        value={addressForm.building}
                        onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الدور</Label>
                      <Input
                        value={addressForm.floor}
                        onChange={(e) => setAddressForm({ ...addressForm, floor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الشقة</Label>
                      <Input
                        value={addressForm.apartment}
                        onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-4 border-b">
                <label className="block text-sm font-medium mb-2">منطقة التوصيل</label>
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
                  <p className="text-sm text-destructive mt-2">لا توجد مناطق توصيل متاحة حالياً</p>
                )}
              </div>

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

              {cartCalculation.savings > 0 && (
                <div className="flex justify-between py-3 bg-green-50 -mx-6 px-6 rounded-lg">
                  <span className="text-green-700 font-semibold">✨ إجمالي التوفير</span>
                  <span className="text-green-700 font-bold text-lg">{cartCalculation.savings.toFixed(2)} جنيه</span>
                </div>
              )}

              <div className="flex justify-between py-4 border-t-2">
                <span className="text-lg font-bold">الإجمالي النهائي</span>
                <span className="text-2xl font-bold text-primary">{cartCalculation.total.toFixed(2)} جنيه</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: التوصيل بعد الساعة ٦ مساءً"
                  className="input-rtl resize-none h-20"
                />
              </div>

              {/* زر واتساب فقط */}
              <button
                onClick={handleCheckout}
                disabled={!selectedArea || isLoadingAreas || isSending}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري حفظ الطلب...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    إتمام الطلب عبر واتساب
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
