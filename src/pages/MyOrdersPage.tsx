import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Clock, MapPin, MessageCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useOrdersStore } from '@/store/ordersStore';
import { Order, OrderStatus } from '@/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending:            { label: 'انتظار التأكيد',  bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  confirmed:          { label: 'تأكّد',           bg: 'bg-blue-100',    text: 'text-blue-700' },
  preparing:          { label: 'يُعدّ',           bg: 'bg-purple-100',  text: 'text-purple-700' },
  out_for_delivery:   { label: 'في الطريق',       bg: 'bg-orange-100',  text: 'text-orange-700' },
  delivered:          { label: 'تم التوصيل',      bg: 'bg-green-100',   text: 'text-green-700' },
};

const OrderCard = ({ order, index }: { order: Order; index: number }) => {
  const status = statusConfig[order.status];
  const displayId = order.supabaseOrderId
    ? order.supabaseOrderId.slice(0, 8)
    : order.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Link
        to={`/orders/${order.id}`}
        className="block bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">رقم الطلب</p>
            <p className="font-bold text-primary">#{displayId}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Item thumbnails */}
        <div className="flex items-center gap-2 mb-3">
          {order.items.slice(0, 2).map((item, i) => (
            <img
              key={i}
              src={item.product.mainImage}
              alt={item.product.nameAr}
              className="w-10 h-10 object-cover rounded-lg border border-muted"
            />
          ))}
          {order.items.length > 2 && (
            <span className="w-10 h-10 rounded-lg border border-muted bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              +{order.items.length - 2}
            </span>
          )}
          <p className="text-sm text-muted-foreground ml-1">
            {order.items.length} {order.items.length === 1 ? 'منتج' : 'منتجات'}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-y-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(order.createdAt)}
            </span>
            {order.deliveryArea && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {order.deliveryArea.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              واتساب
            </span>
          </div>
          <span className="font-bold text-primary text-sm">
            {order.total.toFixed(2)} جنيه
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

const MyOrdersPage = () => {
  const orders = useOrdersStore((state) => state.orders);

  if (orders.length === 0) {
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
            <h1 className="text-2xl font-bold mb-4">لا توجد طلبات بعد</h1>
            <p className="text-muted-foreground mb-8">
              لم تقم بأي طلب حتى الآن. ابدأ التسوق واستكشف منتجاتنا المميزة!
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
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">طلباتي</span>
        </nav>
        <h1 className="text-3xl font-bold mb-6">طلباتي</h1>

        <div className="max-w-2xl mx-auto space-y-4">
          {orders.map((order, idx) => (
            <OrderCard key={order.id} order={order} index={idx} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;