import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Clock, MapPin, MessageCircle, RefreshCw, Ban, Eye, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useOrdersStore } from '@/store/ordersStore';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { formatOrderNumber } from '@/utils/orderNumber';

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

const OrderCard = ({ 
  order, 
  index, 
  onCancel,
  onViewDetails,
  onDelete,
}: { 
  order: Order; 
  index: number; 
  onCancel: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  onDelete: (order: Order) => void;
}) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const displayId = formatOrderNumber(order.orderNumber || order.supabaseOrderId || order.id);
  const canCancel = cancellableStatuses.includes(order.status);
  const canDelete = order.status === 'cancelled' || order.status === 'delivered';

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

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-muted flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(order);
            }}
            className="flex-1 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            عرض التفاصيل
          </Button>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(order);
              }}
              className="flex-1 text-yellow-600 border-yellow-600/30 hover:bg-yellow-50"
            >
              <Ban className="w-3.5 h-3.5" />
              إلغاء
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order);
              }}
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MyOrdersPage = () => {
  const orders = useOrdersStore((state) => state.orders);
  const getUserOrders = useOrdersStore((state) => state.getUserOrders);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
  const updateOrderNumber = useOrdersStore((state) => state.updateOrderNumber);
  const removeOrder = useOrdersStore((state) => state.removeOrder);
  const removeOrderById = useOrdersStore((state) => state.removeOrderById);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        .select('id, status, created_at, order_number')
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
            if (dbOrder.order_number && dbOrder.order_number !== local.orderNumber) {
              updateOrderNumber(dbOrder.id, dbOrder.order_number);
            }
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
  }, [user, orders, updateOrderStatus, updateOrderNumber, removeOrder]);

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
    const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleDeleteOrder = (order: Order) => {
    if (!order.supabaseOrderId) {
      removeOrderById(order.id);
      toast.success('تم حذف الطلب');
      return;
    }
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete || !orderToDelete.supabaseOrderId || !user) return;
    setIsDeleting(true);
    try {
      const { error: itemsErr } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderToDelete.supabaseOrderId);

      if (itemsErr) throw itemsErr;

      const { data: deletedOrder, error: orderErr } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.supabaseOrderId)
        .eq('user_id', user.id)
        .select('id');

      if (orderErr) throw orderErr;

      if (!deletedOrder || deletedOrder.length === 0) {
        toast.error('تم منع الحذف — تحقق من صلاحيات RLS');
        return;
      }

      removeOrder(orderToDelete.supabaseOrderId);
      toast.success('تم حذف الطلب نهائياً');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('فشل حذف الطلب: ' + (error?.message || 'خطأ غير معروف'));
    } finally {
      setIsDeleting(false);
    }
  };

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
              onViewDetails={openOrderDetails}
              onDelete={handleDeleteOrder}
            />
          ))}
        </div>

        {/* Order Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب #{selectedOrder ? formatOrderNumber(selectedOrder.orderNumber || selectedOrder.supabaseOrderId || selectedOrder.id) : ''}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <p className="font-semibold">{statusConfig[selectedOrder.status]?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">المنتجات</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <img
                          src={item.product.mainImage}
                          alt={item.product.nameAr}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{item.product.nameAr}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.selectedSize?.label || item.product.unit} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-primary">{item.lineTotal.toFixed(2)} جنيه</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.deliveryArea && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">معلومات التوصيل</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOrder.deliveryArea.city} - {selectedOrder.deliveryArea.area}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">ملاحظات</h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي:</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رسوم التوصيل:</span>
                    <span>{selectedOrder.deliveryFee.toFixed(2)} جنيه</span>
                  </div>
                  {selectedOrder.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم:</span>
                      <span>- {selectedOrder.totalDiscount.toFixed(2)} جنيه</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>الإجمالي:</span>
                    <span className="text-primary">{selectedOrder.total.toFixed(2)} جنيه</span>
                  </div>
                </div>

                {selectedOrder.appliedOffers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">العروض المطبقة</h4>
                    {selectedOrder.appliedOffers.map((offer, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-sm text-green-800">✨ {offer.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                تأكيد الحذف
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                هل أنت متأكد من حذف هذا الطلب نهائياً؟ لن تتمكن من استرجاعه.
              </p>

              {orderToDelete && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">رقم الطلب</span>
                    <span className="font-mono">#{formatOrderNumber(orderToDelete.orderNumber || orderToDelete.supabaseOrderId || orderToDelete.id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ</span>
                    <span className="font-bold text-destructive">
                      {orderToDelete.total.toFixed(2)} جنيه
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button
                variant="destructive"
                onClick={confirmDeleteOrder}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'جاري الحذف...' : 'حذف نهائياً'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
