import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, MessageCircle, Send, ArrowRight, Clock, MapPin, ShoppingBag } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useOrdersStore } from '@/store/ordersStore';
import { Order } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Component ───────────────────────────────────────────────────────────────

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const getOrderById = useOrdersStore((state) => state.getOrderById);

  const order: Order | undefined = orderId ? getOrderById(orderId) : undefined;

  // إذا مفيش طلب بهذا الـ id → redirect لصفحة طلباتي
  useEffect(() => {
    if (!order) {
      navigate('/my-orders', { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  return (
    <Layout>
      <div className="section-container py-10">
        <div className="max-w-2xl mx-auto">
          {/* ✅ Success Icon + Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">تم إرسال الطلب بنجاح! 🎉</h1>
            <p className="text-muted-foreground">
              {order.contactMethod === 'whatsapp'
                ? 'تم فتح واتساب وإرسال تفاصيل طلبك. انتظر ردّ البائع للتأكيد.'
                : 'تم فتح ماسنجر وإرسال تفاصيل طلبك. انتظر ردّ البائع للتأكيد.'}
            </p>
          </motion.div>

          {/* Order ID + Date */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-md p-6 mb-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm text-muted-foreground">رقم الطلب</p>
                <p className="text-lg font-bold text-primary">{order.id}</p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                <Clock className="w-4 h-4" />
                انتظار التأكيد
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{formatDate(order.createdAt)}</p>
          </motion.div>

          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-md p-6 mb-4"
          >
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              المنتجات
            </h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={item.product.mainImage}
                    alt={item.product.nameAr}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.product.nameAr}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.selectedSize?.label || item.product.unit} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-primary shrink-0">{item.lineTotal.toFixed(2)} جنيه</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Delivery + Notes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl shadow-md p-6 mb-4"
          >
            {order.deliveryArea && (
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">منطقة التوصيل</p>
                  <p className="font-semibold">{order.deliveryArea.city} - {order.deliveryArea.area}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center`}>
                {order.contactMethod === 'whatsapp'
                  ? <MessageCircle className="w-5 h-5 text-green-600" />
                  : <Send className="w-5 h-5 text-blue-500" />
                }
              </div>
              <div>
                <p className="text-sm text-muted-foreground">طريقة التواصل</p>
                <p className="font-semibold">
                  {order.contactMethod === 'whatsapp' ? 'واتساب' : 'ماسنجر'}
                </p>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl shadow-md p-6 mb-6"
          >
            <h2 className="font-bold text-lg mb-4">ملخص المبالغ</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{order.subtotal.toFixed(2)} جنيه</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رسوم التوصيل</span>
                <span>{order.deliveryFee.toFixed(2)} جنيه</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>إجمالي الخصم</span>
                  <span>- {order.totalDiscount.toFixed(2)} جنيه</span>
                </div>
              )}
              {order.appliedOffers.length > 0 && (
                <div className="pt-2 border-t mt-2 space-y-1">
                  {order.appliedOffers.map((o, i) => (
                    <p key={i} className="text-xs text-green-600">✨ {o.message}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-3 border-t">
                <span>الإجمالي النهائي</span>
                <span className="text-primary">{order.total.toFixed(2)} جنيه</span>
              </div>
              {order.savings > 0 && (
                <p className="text-xs text-green-600 text-center pt-1">
                  ✨ وفرت {order.savings.toFixed(2)} جنيه
                </p>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/my-orders"
              className="flex-1 btn-primary py-3 text-center flex items-center justify-center gap-2"
            >
              طلباتي
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Link>
            <Link
              to="/products"
              className="flex-1 py-3 text-center border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
            >
              مواصلة التسوق
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmationPage;