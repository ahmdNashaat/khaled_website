import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Clock, MapPin, MessageCircle, RefreshCw, Ban, Eye, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useOrdersStore } from '@/store/ordersStore';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus, Product, ProductVariant } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { formatOrderNumber } from '@/utils/orderNumber';
import { softDeleteOrder } from '@/services/orderService';

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


const parseDeliveryArea = (address?: string | null, city?: string | null) => {
  const trimmedAddress = (address || '').trim();
  const trimmedCity = (city || '').trim();
  if (!trimmedAddress && !trimmedCity) return null;

  let resolvedCity = trimmedCity;
  let resolvedArea = '';

  if (trimmedAddress.includes('-')) {
    const parts = trimmedAddress.split('-').map((p) => p.trim());
    resolvedCity = resolvedCity || parts[0] || '';
    resolvedArea = (parts[1] || '').split(',')[0]?.trim() || '';
  }

  if (!resolvedCity && trimmedAddress) {
    resolvedCity = trimmedAddress.split(',')[0]?.trim() || '';
  }

  if (!resolvedCity) return null;

  return {
    city: resolvedCity,
    area: resolvedArea,
  };
};

const toLocalOrderFromDb = (
  dbOrder: any,
  productById: Record<string, any>,
  existing?: Order | null
): Order => {
  const deliveryArea = parseDeliveryArea(dbOrder.customer_address, dbOrder.customer_city);
  const mappedStatus = mapSupabaseStatus(dbOrder.status);

  const items = (dbOrder.order_items || []).map((item: any) => {
    const productRow = productById[item.product_id] || null;
    const product: Product = {
      id: productRow?.id || item.product_id || `deleted-${item.id}`,
      nameAr: productRow?.name_ar || item.product_name || 'Product',
      slug: productRow?.slug || '',
      categoryId: productRow?.category_id || '',
      categoryName: (productRow?.categories as any)?.name_ar || '',
      shortDescription: productRow?.short_description || '',
      fullDescription: productRow?.full_description || '',
      basePrice: Number(productRow?.base_price ?? item.unit_price ?? 0),
      originalPrice: productRow?.original_price ? Number(productRow.original_price) : undefined,
      unit: productRow?.unit || '',
      variants: [],
      mainImage: productRow?.main_image || '/placeholder.svg',
      additionalImages: productRow?.additional_images || [],
      isAvailable: productRow?.is_available ?? true,
      isFeatured: productRow?.is_featured ?? false,
      discountPercentage: productRow?.discount_percentage || undefined,
    };

    const selectedVariant: ProductVariant | undefined = item.size_label
      ? {
          id: `size-${item.id}`,
          label: item.size_label,
          price: Number(item.unit_price ?? product.basePrice ?? 0),
        }
      : undefined;

    return {
      product,
      quantity: Number(item.quantity || 0),
      selectedVariant,
      lineTotal: Number(item.total_price ?? (Number(item.unit_price ?? product.basePrice) * Number(item.quantity || 0))),
    };
  });

  return {
    id: existing?.id || dbOrder.id,
    orderNumber: dbOrder.order_number || existing?.orderNumber || dbOrder.id,
    supabaseOrderId: dbOrder.id,
    userId: dbOrder.user_id || existing?.userId || null,
    createdAt: dbOrder.created_at,
    status: mappedStatus,
    contactMethod: 'whatsapp',
    items,
    deliveryArea,
    notes: dbOrder.notes || '',
    subtotal: Number(dbOrder.subtotal ?? 0),
    deliveryFee: Number(dbOrder.delivery_fee ?? 0),
    totalDiscount: Number(existing?.totalDiscount ?? 0),
    total: Number(dbOrder.total ?? 0),
    savings: Number(existing?.savings ?? 0),
    appliedOffers: existing?.appliedOffers || [],
  };
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
  const upsertOrders = useOrdersStore((state) => state.upsertOrders);
  const removeOrderById = useOrdersStore((state) => state.removeOrderById);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const productsCacheRef = useRef<Record<string, any>>({});

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
        .select(`
          id,
          user_id,
          status,
          created_at,
          order_number,
          deleted_at,
          subtotal,
          delivery_fee,
          total,
          notes,
          customer_address,
          customer_city,
          order_items(
            id,
            product_id,
            product_name,
            size_label,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id) // user filter
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const dbOrderIds = new Set(data.map((r) => r.id));

        const productIds = Array.from(
          new Set(
            data
              .flatMap((order) => order.order_items || [])
              .map((item) => item.product_id)
              .filter(Boolean)
          )
        );

        const cachedProducts = productsCacheRef.current;
        const missingProductIds = productIds.filter((id) => !cachedProducts[id]);

        if (missingProductIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              id,
              name_ar,
              slug,
              category_id,
              short_description,
              full_description,
              base_price,
              original_price,
              unit,
              main_image,
              additional_images,
              is_available,
              is_featured,
              discount_percentage,
              categories(name_ar)
            `)
            .in('id', missingProductIds);

          if (productsError) throw productsError;

          productsCacheRef.current = (productsData || []).reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, { ...cachedProducts } as Record<string, any>);
        }

        // ?????? ?????????????? ???????? ???????????? ?????????? ???? ?????? DB
        const localUserOrderIds = orders
          .filter((o) => o.supabaseOrderId && o.userId === user.id)
          .map((o) => o.supabaseOrderId as string);

        localUserOrderIds.forEach((id) => {
          if (!dbOrderIds.has(id)) {
            removeOrder(id);
          }
        });

        const mergedOrders = data.map((dbOrder) => {
          const existing = orders.find((o) => o.supabaseOrderId === dbOrder.id) || null;
          return toLocalOrderFromDb(dbOrder, productsCacheRef.current, existing);
        });

        upsertOrders(mergedOrders);
      }
    } catch (err) {
      console.error('sync error:', err);
      toast.error('فشل تحديث الطلبات');
    } finally {
      setIsSyncing(false);
    }
  }, [user, orders, removeOrder, upsertOrders]);

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

    const channel = supabase
      .channel('my-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          syncOrdersFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status?: string; order_number?: string | null; deleted_at?: string | null };
          if (row.deleted_at) {
            removeOrder(row.id);
            toast.warning('Order hidden.');
            return;
          }
          if (row.order_number) {
            updateOrderNumber(row.id, row.order_number);
          }
          if (row.status) {
            updateOrderStatus(row.id, row.status);
            toast.info('Order status updated.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, syncOrdersFromSupabase, updateOrderStatus, updateOrderNumber, removeOrder]);


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
      await softDeleteOrder({
        orderId: orderToDelete.supabaseOrderId,
        userId: user.id,
        role: 'customer',
        reason: 'customer_deleted',
      });

      removeOrder(orderToDelete.supabaseOrderId);
      toast.success('تم إخفاء الطلب من حسابك');
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
                : 'قم بتسجيل الدخول لعرض طلباتك، أو ابدأ التسوق الآن واطلب عبر الواتساب.'
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
              ðŸ’¡ <strong>تنبيه:</strong> أنت تتصفح كزائر. طلباتك محفوظة محلياً فقط. 
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
                            {item.selectedVariant?.label || item.product.unit} × {item.quantity}
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
                تأكيد الإخفاء
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                هل أنت متأكد من إخفاء هذا الطلب من حسابك؟ سيظل محفوظاً لدى الإدارة لأغراض المتابعة.
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
                {isDeleting ? 'جاري الإخفاء...' : 'إخفاء الطلب'}
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
