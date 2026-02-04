import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import AvatarUpload from '@/components/profile/AvatarUpload';

type AdminPreferences = {
  notificationsEnabled: boolean;
  weeklySummary: boolean;
  defaultOrderStatus: string;
  dashboardLayout: string;
  twoFactorEnabled: boolean;
};

const AdminSettings = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [preferences, setPreferences] = useState<AdminPreferences>({
    notificationsEnabled: true,
    weeklySummary: true,
    defaultOrderStatus: 'all',
    dashboardLayout: 'comfortable',
    twoFactorEnabled: false,
  });
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadPreferences = async () => {
      setIsPreferencesLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            notificationsEnabled: data.notifications_enabled ?? true,
            weeklySummary: data.weekly_summary ?? true,
            defaultOrderStatus: data.default_order_status || 'all',
            dashboardLayout: data.dashboard_layout || 'comfortable',
            twoFactorEnabled: data.two_factor_enabled ?? false,
          });
        }
      } catch (error) {
        console.error('Failed to load admin preferences:', error);
        toast.error('حدث خطأ أثناء تحميل التفضيلات');
      } finally {
        setIsPreferencesLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const persistPreferences = async (next: AdminPreferences) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('admin_preferences')
        .upsert(
          {
            user_id: user.id,
            notifications_enabled: next.notificationsEnabled,
            weekly_summary: next.weeklySummary,
            default_order_status: next.defaultOrderStatus,
            dashboard_layout: next.dashboardLayout,
            two_factor_enabled: next.twoFactorEnabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to save admin preferences:', error);
      toast.error(error?.message || 'حدث خطأ أثناء حفظ التفضيلات');
    }
  };

  const updatePreferences = (updater: (prev: AdminPreferences) => AdminPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      void persistPreferences(next);
      return next;
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: displayName || null,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          full_name: displayName || null,
          avatar_url: avatarUrl || null,
        },
      });

      toast.success('تم تحديث بيانات الحساب');
    } catch (error: any) {
      console.error('Error updating admin profile:', error);
      toast.error(error?.message || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!password || password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('تأكيد كلمة المرور غير مطابق');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('تم تحديث كلمة المرور');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error?.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إعدادات المسؤول</h1>
          <p className="text-muted-foreground">أدر بيانات حسابك وتفضيلات النظام.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>صورة الحساب</Label>
                <div className="mt-2">
                  <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} />
                  <div className="mt-3">
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="أو ضع رابط الصورة هنا"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم العرض</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="اسم المسؤول"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={user?.email || ''} readOnly dir="ltr" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الأمان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">المصادقة الثنائية</p>
                  <p className="text-sm text-muted-foreground">قريباً: فعّل حماية إضافية للحساب.</p>
                </div>
                <Switch
                  checked={preferences.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    updatePreferences((prev) => ({ ...prev, twoFactorEnabled: checked }))
                  }
                  disabled={isPreferencesLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword} className="w-full">
                {isUpdatingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفضيلات النظام</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إشعارات الطلبات</p>
                  <p className="text-sm text-muted-foreground">تنبيهات عند وصول طلبات جديدة.</p>
                </div>
                <Switch
                  checked={preferences.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    updatePreferences((prev) => ({ ...prev, notificationsEnabled: checked }))
                  }
                  disabled={isPreferencesLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">ملخص أسبوعي</p>
                  <p className="text-sm text-muted-foreground">تقرير أسبوعي عن الأداء.</p>
                </div>
                <Switch
                  checked={preferences.weeklySummary}
                  onCheckedChange={(checked) =>
                    updatePreferences((prev) => ({ ...prev, weeklySummary: checked }))
                  }
                  disabled={isPreferencesLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>فلتر الحالة الافتراضي</Label>
              <Select
                value={preferences.defaultOrderStatus}
                onValueChange={(value) =>
                  updatePreferences((prev) => ({ ...prev, defaultOrderStatus: value }))
                }
                disabled={isPreferencesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="processing">قيد التجهيز</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تخطيط لوحة التحكم</Label>
              <Select
                value={preferences.dashboardLayout}
                onValueChange={(value) =>
                  updatePreferences((prev) => ({ ...prev, dashboardLayout: value }))
                }
                disabled={isPreferencesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التخطيط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">مريح</SelectItem>
                  <SelectItem value="compact">مضغوط</SelectItem>
                  <SelectItem value="spacious">واسع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
