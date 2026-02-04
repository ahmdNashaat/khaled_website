import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  MapPin,
  ShoppingBag,
  LogOut,
  Phone,
  Wallet,
  Edit,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useOrdersStore } from '@/store/ordersStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { OrderStatus, UserProfile } from '@/types';
import { formatOrderNumber } from '@/utils/orderNumber';
import { supabase } from '@/integrations/supabase/client';
import EditProfileDialog, { ProfileFormValues } from '@/components/profile/EditProfileDialog';
import AddressBook from '@/components/profile/AddressBook';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'قيد المراجعة', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'مؤكد', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: 'قيد التحضير', bg: 'bg-purple-100', text: 'text-purple-700' },
  out_for_delivery: { label: 'خرج للتوصيل', bg: 'bg-orange-100', text: 'text-orange-700' },
  delivered: { label: 'تم التوصيل', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'ملغي', bg: 'bg-red-100', text: 'text-red-700' },
};

const ProfilePage = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const getUserOrders = useOrdersStore((state) => state.getUserOrders);
  const orders = user ? getUserOrders(user.id) : [];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (isAdmin) {
        navigate('/admin/settings');
      }
    }
  }, [isLoading, user, isAdmin, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
            })
            .select('user_id, full_name, phone, created_at')
            .single();

          if (createError) throw createError;
          setProfile(created as UserProfile);
        } else {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الملف الشخصي');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const handleProfileSave = async (values: ProfileFormValues) => {
    if (!user) return;

    const previous = profile;
    const optimistic: UserProfile = {
      user_id: user.id,
      full_name: values.full_name,
      phone: values.phone || null,
      created_at: profile?.created_at,
    };

    setIsSaving(true);
    setProfile(optimistic);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: values.full_name,
            phone: values.phone || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
          phone: values.phone || null,
        },
      });

      toast.success('تم تحديث الملف الشخصي');
      setIsEditOpen(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setProfile(previous || null);
      toast.error(error?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
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
      value: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: 'الطلبات المكتملة',
      value: orders.filter((o) => o.status === 'delivered').length,
      color: 'text-green-600 bg-green-100',
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      label: 'إجمالي الإنفاق',
      value: `${totalSpent.toFixed(2)} جنيه`,
      color: 'text-amber-700 bg-amber-100',
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="section-container py-16">
          <div className="h-10 w-40 bg-muted animate-pulse rounded-lg mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-40 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || isAdmin) {
    return null;
  }

  const editInitialValues: ProfileFormValues = {
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    phone: profile?.phone || user?.user_metadata?.phone || '',
  };

  return (
    <Layout>
      <div className="section-container py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">الملف الشخصي</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.full_name || user?.user_metadata?.full_name || 'مستخدم جديد'}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1" dir="ltr">
                      <Phone className="w-4 h-4" />
                      {profile?.phone || 'غير مضاف'}
                    </p>
                  </div>

                  <Button onClick={() => setIsEditOpen(true)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    تعديل الملف الشخصي
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">إجراءات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/my-orders">
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingBag className="w-4 h-4 ml-2" />
                    طلباتي
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                          <p className="text-lg font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

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
                    <p className="text-muted-foreground mb-4">لا توجد طلبات حتى الآن</p>
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

            <Card>
              <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isProfileLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((idx) => (
                      <div key={idx} className="h-10 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الاسم الكامل</p>
                      <p className="font-medium">{profile?.full_name || 'غير متوفر'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                      <p className="font-medium" dir="ltr">
                        {profile?.phone || 'غير متوفر'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">تاريخ الانضمام</p>
                      <p className="font-medium">
                        {user?.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  إدارة العناوين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddressBook userId={user?.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        email={user?.email || ''}
        initialValues={editInitialValues}
        isSaving={isSaving}
        onSubmit={handleProfileSave}
      />
    </Layout>
  );
};

export default ProfilePage;
