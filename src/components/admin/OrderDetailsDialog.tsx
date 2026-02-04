import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trash2, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderStatus, UserAddress, UserProfile } from '@/types';
import { formatOrderNumber } from '@/utils/orderNumber';

const statusOptions: { value: AdminOrderStatus; label: string }[] = [
  { value: 'pending', label: 'معلق' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغي' },
];

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminOrder | null;
  onStatusChange: (orderId: string, newStatus: AdminOrderStatus) => void;
  onRequestDelete: (order: AdminOrder) => void;
}

const OrderDetailsDialog = ({
  open,
  onOpenChange,
  order,
  onStatusChange,
  onRequestDelete,
}: OrderDetailsDialogProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!open || !order?.user_id) {
        setProfile(null);
        setAddresses([]);
        setOrderCount(null);
        return;
      }

      setIsLoading(true);
      try {
          const [{ data: profileData }, { data: addressesData }, { count }] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name, phone, created_at')
            .eq('user_id', order.user_id)
            .maybeSingle(),
          supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', order.user_id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', order.user_id),
        ]);

        setProfile(profileData as UserProfile | null);
        setAddresses((addressesData || []) as UserAddress[]);
        setOrderCount(typeof count === 'number' ? count : null);
      } catch (error) {
        console.error('Error loading customer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [open, order?.user_id]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            تفاصيل الطلب #{formatOrderNumber(order.order_number || order.id)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              معلومات العميل
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">الاسم في الطلب</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">الهاتف في الطلب</p>
                <a href={`tel:${order.customer_phone}`} className="text-primary" dir="ltr">
                  {order.customer_phone}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">اسم الحساب</p>
                <p className="font-medium">{profile?.full_name || 'غير متوفر'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">هاتف الحساب</p>
                <p className="font-medium" dir="ltr">
                  {profile?.phone || 'غير متوفر'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">عدد طلبات العميل</p>
                <p className="font-medium">{orderCount ?? '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">معرف العميل</p>
                <p className="font-mono text-xs">{order.user_id || 'عميل زائر'}</p>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.customer_address}، {order.customer_city}</span>
              </div>
            </div>
            {isLoading && (
              <p className="text-xs text-muted-foreground">جاري تحميل بيانات العميل...</p>
            )}
          </div>

          {addresses.length > 0 && (
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">عناوين العميل</h4>
              <div className="grid gap-3">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{address.label}</span>
                      {address.is_default && <Badge variant="secondary">افتراضي</Badge>}
                    </div>
                    <p className="text-muted-foreground">
                      {address.city} - {address.area}، {address.street}
                      {address.building ? `، عمارة ${address.building}` : ''}
                      {address.floor ? `، الدور ${address.floor}` : ''}
                      {address.apartment ? `، شقة ${address.apartment}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  {order.order_items?.map((item) => (
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

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي:</span>
                <span>{Number(order.subtotal).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رسوم التوصيل:</span>
                <span>{Number(order.delivery_fee).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>الإجمالي:</span>
                <span className="text-primary">{Number(order.total).toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div>
              <h4 className="font-semibold mb-2">ملاحظات</h4>
              <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              <span className="font-medium">الحالة:</span>
              <Select
                value={order.status}
                onValueChange={(value) => onStatusChange(order.id, value as AdminOrderStatus)}
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

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRequestDelete(order)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف الطلب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
