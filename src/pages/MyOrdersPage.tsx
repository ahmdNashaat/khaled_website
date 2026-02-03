import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Clock, MapPin, MessageCircle, RefreshCw, Ban } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useOrdersStore } from '@/store/ordersStore';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'انتظار التأكيد', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'تأكّد', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: 'يُعدّ', bg: 'bg-purple-100', text: 'text-purple-700' },
  out_for_delivery: { label: 'في الطريق', bg: 'bg-orange-100', text: 'text-orange-700' },
  delivered: { label: 'تم التوصيل', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'ملغي', bg: 'bg-red-100', text: 'text-red-700' },
};

// Map Supabase status to app status
const mapSupabaseStatus = (dbStatus: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'processing': 'preparing',
    'shipped': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
  };
  return statusMap[dbStatus] || 'pending';
};

// العميل يقدر يلغي بس لما الطلب معلق أو مؤكد
const cancellableStatuses = ['pending', 'confirmed'];

const OrderCard = ({ order, index, onCancel }: { order: Order; index: number; onCancel: (order: Order) => void }) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const displayId = order.supabaseOrderId
    ? order.supabaseOrderId.slice(0, 8)
    : order.id;
  const canCancel = cancellableStatuses.includes(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="block bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow">
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

        {/* Cancel Button — بس للطلبات اللي ممكن تتلغى */}
        {canCancel && (
          <div className="mt-3 pt-3 border-t border-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(order);
              }}
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              إلغاء الطلب
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MyOrdersPage = () => {
  const orders = useOrdersStore((state) => state.orders);
  const getUserOrders = useOrdersStore((state) => state.getUserOrders);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
  const removeOrder = useOrdersStore((state) => state.removeOrder);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();

  // ⬅️ فلترة الطلبات: نعرض فقط طلبات المستخدم الحالي
  const userOrders = getUserOrders(user ? user.id : null);

  // ─── جلب الطلبات من Supabase وربطها بالـ local store ─────────────
  const syncOrdersFromSupabase = useCallback(async () => {
    // لو المستخدم مش مسجل دخول، مفيش داعي نعمل sync
    if (!user) return;

    setIsSyncing(true);
    try {
      // ⬅️ جلب طلبات المستخدم الحالي فقط من Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .eq('user_id', user.id) // ⬅️ هنا الحل الأساسي!
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const dbOrderIds = new Set(data.map((r) => r.id));
        
        // حذف الطلبات اللي الأدمن حذفها من الـ DB
        const localUserOrderIds = orders
          .filter((o) => o.supabaseOrderId && o.userId === user.id)
          .map((o) => o.supabaseOrderId as string);

        localUserOrderIds.forEach((id) => {
          if (!dbOrderIds.has(id)) {
            removeOrder(id);
          }
        });

        // تحديث حالة الطلبات
        let changed = false;
        data.forEach((dbOrder) => {
          const local = orders.find((o) => o.supabaseOrderId === dbOrder.id);
          if (local) {
            const mapped = mapSupabaseStatus(dbOrder.status);
            if (local.status !== mapped) {
              updateOrderStatus(dbOrder.id, dbOrder.status);
              changed = true;
            }
          }
        });

        if (changed) toast.success('تم تحديث حالة الطلبات');
      }
    } catch (err) {
      console.error('sync error:', err);
      toast.error('فشل تحديث الطلبات');
    } finally {
      setIsSyncing(false);
    }
  }, [user, orders, updateOrderStatus, removeOrder]);

  // ─── Auto-sync كل 30 ثانية ──────────────────────────────────────
  useEffect(() => {
    if (user) {
      syncOrdersFromSupabase();
      const interval = setInterval(syncOrdersFromSupabase, 30000);
      return () => clearInterval(interval);
    }
  }, [syncOrdersFromSupabase, user]);

  // ─── Realtime subscription: UPDATE + DELETE ─────────────────────
  useEffect(() => {
    if (!user) return;

    const localIds = orders
      .filter((o) => o.supabaseOrderId && o.userId === user.id)
      .map((o) => o.supabaseOrderId as string);

    if (localIds.length === 0) return;

    const channel = supabase
      .channel('my-orders-realtime')
      // الأدمن غيّر الحالة
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=in.(${localIds.join(',')})`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          updateOrderStatus(row.id, row.status);
          toast.info('تم تحديث حالة طلب');
        }
      )
      // الأدمن حذف الطلب
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `id=in.(${localIds.join(',')})`,
        },
        (payload) => {
          const row = payload.old as { id: string };
          removeOrder(row.id);
          toast.warning('حذف أحد طلباتك من قِبل الإدارة');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orders.length, updateOrderStatus, removeOrder]);

  // ─── إلغاء طلب من جانب العميل ───────────────────────────────────
  const handleCancelOrder = async (order: Order) => {
    if (!order.supabaseOrderId) {
      toast.error('لا يمكن إلغاء هذا الطلب');
      return;
    }

    // تأكيد قبل الإلغاء
    if (!window.confirm('هل أنت متأكد إنك عاوز تلغي الطلب؟')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.supabaseOrderId);

      if (error) throw error;

      // حدّل محلياً فوراً بدل ما ننتظر الـ realtime
      updateOrderStatus(order.supabaseOrderId, 'cancelled');
      toast.success('تم إلغاء الطلب بنجاح');
    } catch (err) {
      console.error('cancel error:', err);
      toast.error('فشل إلغاء الطلب');
    }
  };

  // ─── Empty state ─────────────────────────────────────────────────
  if (userOrders.length === 0) {
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
              {user 
                ? 'لم تقم بأي طلب حتى الآن. ابدأ التسوق واستكشف منتجاتنا المميزة!'
                : 'قم بتسجيل الدخول لعرض طلباتك، أو ابدأ التسوق الآن!'
              }
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

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="section-container py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">طلباتي</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            طلباتي
            {!user && <span className="text-sm font-normal text-muted-foreground mr-2">(طلبات محلية)</span>}
          </h1>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncOrdersFromSupabase}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          )}
        </div>

        {!user && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>تنبيه:</strong> أنت تتصفح كزائر. طلباتك محفوظة محلياً فقط. 
              <Link to="/auth" className="text-primary font-semibold underline mr-1">
                سجل دخول
              </Link>
              لحفظ طلباتك وتتبعها بشكل دائم.
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-4">
          {userOrders.map((order, idx) => (
            <OrderCard
              key={order.id}
              order={order}
              index={idx}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
