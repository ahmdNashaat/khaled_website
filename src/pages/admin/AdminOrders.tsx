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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, ShoppingCart, Eye, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  product_name: string;
  size_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

const statusOptions: { value: OrderStatus; label: string; className: string }[] = [
  { value: 'pending', label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'قيد التجهيز', className: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'تم الشحن', className: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'ملغي', className: 'bg-red-100 text-red-800' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusInfo = statusOptions.find((s) => s.value === status);
    return statusInfo || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
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
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
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
                              onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {/* Order Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold mb-3">معلومات العميل</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">الاسم:</span>
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedOrder.customer_phone}`} className="text-primary">
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedOrder.customer_address}، {selectedOrder.customer_city}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">المنتجات</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-right py-2 px-3 font-medium text-sm">المنتج</th>
                          <th className="text-right py-2 px-3 font-medium text-sm">الحجم</th>
                          <th className="text-right py-2 px-3 font-medium text-sm">الكمية</th>
                          <th className="text-right py-2 px-3 font-medium text-sm">السعر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.order_items?.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="py-2 px-3">{item.product_name}</td>
                            <td className="py-2 px-3 text-muted-foreground">{item.size_label || '-'}</td>
                            <td className="py-2 px-3">{item.quantity}</td>
                            <td className="py-2 px-3">{Number(item.total_price).toLocaleString('ar-EG')} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي:</span>
                      <span>{Number(selectedOrder.subtotal).toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رسوم التوصيل:</span>
                      <span>{Number(selectedOrder.delivery_fee).toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-primary">{Number(selectedOrder.total).toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">ملاحظات</h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Status Change */}
                <div className="flex items-center gap-4">
                  <span className="font-medium">تغيير الحالة:</span>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value as OrderStatus)}
                  >
                    <SelectTrigger className="w-40">
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
