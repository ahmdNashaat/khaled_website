import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminNotificationPanel } from '@/components/admin/AdminNotificationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, FolderTree, ShoppingCart, Tag, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { formatOrderNumber } from '@/utils/orderNumber';

interface DashboardStats {
  productsCount: number;
  categoriesCount: number;
  ordersCount: number;
  pendingOrdersCount: number;
  offersCount: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    productsCount: 0,
    categoriesCount: 0,
    ordersCount: 0,
    pendingOrdersCount: 0,
    offersCount: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, categories, allOrders, revenueOrders, pendingOrders, offers] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          // كل الطلبات شامل cancelled — عدد فقط
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          // المبيعات فعلية — بدون cancelled
          supabase.from('orders').select('id, total').neq('status', 'cancelled'),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        const totalRevenue = revenueOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

        setStats({
          productsCount: products.count || 0,
          categoriesCount: categories.count || 0,
          ordersCount: allOrders.count || 0,
          pendingOrdersCount: pendingOrders.count || 0,
          offersCount: offers.count || 0,
          totalRevenue,
        });

        const { data: recent } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentOrders(recent || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'المنتجات', value: stats.productsCount, icon: Package, color: 'bg-blue-500' },
    { title: 'الأقسام', value: stats.categoriesCount, icon: FolderTree, color: 'bg-green-500' },
    { title: 'إجمالي الطلبات', value: stats.ordersCount, icon: ShoppingCart, color: 'bg-purple-500' },
    { title: 'طلبات معلقة', value: stats.pendingOrdersCount, icon: Clock, color: 'bg-yellow-500' },
    { title: 'العروض النشطة', value: stats.offersCount, icon: Tag, color: 'bg-pink-500' },
    {
      title: 'إجمالي المبيعات',
      value: `${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`,
      icon: TrendingUp,
      color: 'bg-primary',
      isLarge: true,
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
      processing: { label: 'قيد التجهيز', className: 'bg-purple-100 text-purple-800' },
      shipped: { label: 'تم الشحن', className: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' },
    };
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم متجر مذاق</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.isLarge ? 'text-primary' : ''}`}>
                        {isLoading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color} text-white`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
<Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                أحدث الطلبات
              </CardTitle>
              <Link to="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                عرض كل الطلبات
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد طلبات حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">العميل</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">المبلغ</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const status = getStatusBadge(order.status);
                      return (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-3 px-2 font-mono text-sm">
                            #{formatOrderNumber(order.order_number || order.id)}
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_city}</p>
                          </td>
                          <td className="py-3 px-2">
                            {Number(order.total).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-sm">
                            {new Date(order.created_at).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
          <div>
            <AdminNotificationPanel />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;