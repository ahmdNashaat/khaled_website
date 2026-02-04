import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, ShoppingBag, Heart, Settings, LogOut, Edit } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useOrdersStore } from '@/store/ordersStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/types';
import { formatOrderNumber } from '@/utils/orderNumber';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'انتظار التأكيد', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'تأكّد', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: 'يُعدّ', bg: 'bg-purple-100', text: 'text-purple-700' },
  out_for_delivery: { label: 'في الطريق', bg: 'bg-orange-100', text: 'text-orange-700' },
  delivered: { label: 'تم التوصيل', bg: 'bg-green-100', text: 'text-green-700' },
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const getUserOrders = useOrdersStore((state) => state.getUserOrders);
  const orders = user ? getUserOrders(user.id) : [];
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    // عرض آخر 5 طلبات فقط
    setRecentOrders(orders.slice(0, 5));
  }, [orders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const stats = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: 'إجمالي الطلبات',
      value: orders.length,
      color: 'text-primary bg-primary/10',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: 'الطلبات النشطة',
      value: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: 'الطلبات المكتملة',
      value: orders.filter(o => o.status === 'delivered').length,
      color: 'text-green-600 bg-green-100',
    },
  ];

  return (
    <Layout>
      <div className="section-container py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">حسابي</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {/* Avatar */}
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* User Info */}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {user?.user_metadata?.full_name || 'مستخدم'}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>

                  {/* Edit Profile Button */}
                  <Button variant="outline" className="w-full" disabled>
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل الملف الشخصي
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">القائمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/my-orders">
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    طلباتي
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" disabled>
                  <Heart className="w-4 h-4 mr-2" />
                  المفضلة
                </Button>
                <Button variant="ghost" className="w-full justify-start" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  الإعدادات
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>آخر الطلبات</CardTitle>
                {orders.length > 5 && (
                  <Link to="/my-orders" className="text-sm text-primary hover:underline">
                    عرض الكل
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">لا توجد طلبات بعد</p>
                    <Link to="/products">
                      <Button>تصفح المنتجات</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => {
                      const status = statusConfig[order.status];
                      return (
                        <Link
                          key={order.id}
                          to={`/orders/${order.id}`}
                          className="block p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">رقم الطلب</p>
                              <p className="font-bold text-primary">
                                #{formatOrderNumber(order.orderNumber || order.supabaseOrderId || order.id)}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="font-bold text-foreground">
                              {order.total.toFixed(2)} جنيه
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            {order.items.slice(0, 3).map((item, i) => (
                              <img
                                key={i}
                                src={item.product.mainImage}
                                alt={item.product.nameAr}
                                className="w-10 h-10 object-cover rounded border"
                              />
                            ))}
                            {order.items.length > 3 && (
                              <span className="w-10 h-10 rounded border bg-muted flex items-center justify-center text-xs font-bold">
                                +{order.items.length - 3}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الاسم الكامل</p>
                    <p className="font-medium">{user?.user_metadata?.full_name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                    <p className="font-medium">{user?.user_metadata?.phone || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ التسجيل</p>
                    <p className="font-medium">
                      {user?.created_at ? formatDate(user.created_at) : 'غير متاح'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
