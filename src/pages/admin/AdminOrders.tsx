import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, ShoppingCart, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { formatOrderNumber } from '@/utils/orderNumber';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
import { AdminOrder, AdminOrderStatus } from '@/types';

const statusOptions: { value: AdminOrderStatus; label: string; className: string }[] = [
  { value: 'pending', label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'قيد التجهيز', className: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'تم الشحن', className: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'ملغي', className: 'bg-red-100 text-red-800' },
];

const AdminOrders = () => {
  const { isAdmin, isLoading: isAuthLoading } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // حذف — confirmation dialog
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('خطأ في تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      toast.error('هذه الصفحة للمسؤولين فقط');
    }
  }, [isAdmin, isAuthLoading]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: AdminOrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('تم تحديث حالة الطلب');
      fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  // فتح dialog التأكيد فقط — الحذف الفعلي في confirmDelete
  const requestDelete = (order: AdminOrder) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  // الحذف الفعلي بعد تأكيد الأدمن
  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      console.log('Starting delete for order:', orderToDelete.id);

      const { data: deletedItems, error: itemsErr, count: itemsCount } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderToDelete.id)
        .select();

      console.log('Items delete result:', { deletedItems, itemsCount, itemsErr });

      if (itemsErr) {
        console.error('Items delete error:', itemsErr);
        throw new Error(`Failed to delete order items: ${itemsErr.message}`);
      }

      const { data: deletedOrder, error: orderErr, count: orderCount } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id)
        .select();

      console.log('Order delete result:', { deletedOrder, orderCount, orderErr });

      if (orderErr) {
        console.error('Order delete error:', orderErr);
        throw new Error(`Failed to delete order: ${orderErr.message}`);
      }

      if (orderCount === 0) {
        console.error('RLS Policy Issue: Delete returned 0 rows');
        toast.error('الحذف مرفوض بسبب صلاحيات RLS، تحقق من صلاحيات الأدمن في Supabase');
        return;
      }

      console.log('Order deleted successfully');
      toast.success('تم حذف الطلب بنجاح');
      setDeleteDialogOpen(false);
      setDialogOpen(false);
      setOrderToDelete(null);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Delete operation failed:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف الطلب');
    } finally {
      setIsDeleting(false);
    }
  };

  const openOrderDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: AdminOrderStatus) => {
    const statusInfo = statusOptions.find((s) => s.value === status);
    return statusInfo || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
          <p className="text-muted-foreground">عرض وإدارة طلبات العملاء</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو الهاتف أو رقم الطلب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              الطلبات ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد طلبات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">العميل</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">المدينة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">المبلغ</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const status = getStatusBadge(order.status);
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 px-2 font-mono text-sm">
                            #{formatOrderNumber(order.order_number || order.id)}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground" dir="ltr">
                                {order.customer_phone}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {order.customer_city}
                          </td>
                          <td className="py-3 px-2 font-medium">
                            {Number(order.total).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="py-3 px-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value as AdminOrderStatus)}
                            >
                              <SelectTrigger className={`w-32 h-8 text-xs ${status.className}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-sm">
                            {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openOrderDetails(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => requestDelete(order)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <OrderDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          order={selectedOrder}
          onStatusChange={handleStatusChange}
          onRequestDelete={requestDelete}
        />

        {/* حذف — dialog التأكيد */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                تأكيد الحذف
              </DialogTitle>
              <DialogDescription>
                هذا الإجراء لا يمكن التراجع عنه
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <p className="text-muted-foreground">
                هل أنت متأكد أنك تريد حذف الطلب؟ سيتم حذف جميع بيانات الطلب والمنتجات المرتبطة به نهائياً.
              </p>
              {orderToDelete && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رقم الطلب</span>
                    <span className="font-mono font-medium">#{formatOrderNumber(orderToDelete.order_number || orderToDelete.id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">العميل</span>
                    <span className="font-medium">{orderToDelete.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ</span>
                    <span className="font-bold text-destructive">
                      {Number(orderToDelete.total).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button
                variant="destructive"
                onClick={confirmDelete}
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
    </AdminLayout>
  );
};

export default AdminOrders;
