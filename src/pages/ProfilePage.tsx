import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MapPin, ShoppingBag, Heart, Settings, LogOut, Save } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useOrdersStore } from '@/store/ordersStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Order, OrderStatus, UserProfile } from '@/types';
import { formatOrderNumber } from '@/utils/orderNumber';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import AddressBook from '@/components/AddressBook';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: '?????? ???????', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: '?????', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: '?????', bg: 'bg-purple-100', text: 'text-purple-700' },
  out_for_delivery: { label: '?? ??????', bg: 'bg-orange-100', text: 'text-orange-700' },
  delivered: { label: '?? ???????', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: '????', bg: 'bg-red-100', text: 'text-red-700' },
};

const profileSchema = z.object({
  full_name: z.string().min(2, '????? ?????? ?????').max(100),
  phone: z
    .string()
    .min(8, '??? ?????? ??? ????')
    .max(20)
    .optional()
    .or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const getUserOrders = useOrdersStore((state) => state.getUserOrders);
  const orders = user ? getUserOrders(user.id) : [];
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({ full_name: '', phone: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRecentOrders(orders.slice(0, 5));
  }, [orders]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, avatar_url, created_at')
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
            .select('user_id, full_name, phone, avatar_url, created_at')
            .single();

          if (createError) throw createError;
          setProfile(created as UserProfile);
          setProfileForm({
            full_name: created?.full_name || user.user_metadata?.full_name || '',
            phone: created?.phone || user.user_metadata?.phone || '',
          });
        } else {
          setProfile(data as UserProfile);
          setProfileForm({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            phone: data.phone || user.user_metadata?.phone || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('??? ??? ????? ????? ????????');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('?? ????? ?????? ?????');
    } catch (error) {
      toast.error('??? ??? ????? ????? ??????');
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    const parsed = profileSchema.safeParse(profileForm);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || '???? ?????? ?? ????????');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
        },
      });

      setProfile((prev) =>
        prev
          ? { ...prev, full_name: parsed.data.full_name, phone: parsed.data.phone || null }
          : {
              user_id: user.id,
              full_name: parsed.data.full_name,
              phone: parsed.data.phone || null,
            }
      );

      toast.success('?? ????? ????? ??????');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error?.message || '??? ??? ????? ??? ????????');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: '?????? ???????',
      value: orders.length,
      color: 'text-primary bg-primary/10',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: '??????? ??????',
      value: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      label: '??????? ????????',
      value: orders.filter(o => o.status === 'delivered').length,
      color: 'text-green-600 bg-green-100',
    },
  ];

  return (
    <Layout>
      <div className="section-container py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">????????</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">?????</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.full_name || user?.user_metadata?.full_name || '??????'}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">???????</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/my-orders">
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    ??????
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" disabled>
                  <Heart className="w-4 h-4 mr-2" />
                  ???????
                </Button>
                <Button variant="ghost" className="w-full justify-start" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  ?????????
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  ????? ??????
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>??? ???????</CardTitle>
                {orders.length > 5 && (
                  <Link to="/my-orders" className="text-sm text-primary hover:underline">
                    ??? ????
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">?? ???? ????? ???</p>
                    <Link to="/products">
                      <Button>???? ????????</Button>
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
                              <p className="text-sm text-muted-foreground">??? ?????</p>
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
                              {order.total.toFixed(2)} ????
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
                <CardTitle>??????? ??????</CardTitle>
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
                      <p className="text-sm text-muted-foreground mb-1">????? ??????</p>
                      <p className="font-medium">{profile?.full_name || '??? ????'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">?????? ??????????</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">??? ??????</p>
                      <p className="font-medium" dir="ltr">
                        {profile?.phone || '??? ????'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">????? ???????</p>
                      <p className="font-medium">
                        {user?.created_at ? formatDate(user.created_at) : '??? ????'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>????? ????? ??????</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>????? ??????</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="???? ????"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>??? ??????</Label>
                    <Input
                      value={profileForm.phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="????: 01000000000"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Button onClick={handleProfileSave} disabled={isSaving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isSaving ? '???? ?????...' : '??? ?????????'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  ?????? ???????
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddressBook userId={user?.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
