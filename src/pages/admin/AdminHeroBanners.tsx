import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface HeroBanner {
  id: string;
  title_ar: string;
  subtitle_ar: string | null;
  description: string | null;
  image_url: string;
  cta_primary_text: string | null;
  cta_primary_link: string | null;
  cta_secondary_text: string | null;
  cta_secondary_link: string | null;
  badge_text: string | null;
  gradient_class: string;
  display_order: number;
  is_active: boolean;
}

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title_ar: '',
    subtitle_ar: '',
    description: '',
    image_url: '',
    cta_primary_text: '',
    cta_primary_link: '',
    cta_secondary_text: '',
    cta_secondary_link: '',
    badge_text: '',
    gradient_class: 'from-primary/90 via-primary/70 to-transparent',
    display_order: 0,
    is_active: true,
  });

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('خطأ في تحميل البانرات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openDialog = (banner?: HeroBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title_ar: banner.title_ar,
        subtitle_ar: banner.subtitle_ar || '',
        description: banner.description || '',
        image_url: banner.image_url,
        cta_primary_text: banner.cta_primary_text || '',
        cta_primary_link: banner.cta_primary_link || '',
        cta_secondary_text: banner.cta_secondary_text || '',
        cta_secondary_link: banner.cta_secondary_link || '',
        badge_text: banner.badge_text || '',
        gradient_class: banner.gradient_class,
        display_order: banner.display_order,
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title_ar: '',
        subtitle_ar: '',
        description: '',
        image_url: '',
        cta_primary_text: '',
        cta_primary_link: '',
        cta_secondary_text: '',
        cta_secondary_link: '',
        badge_text: '',
        gradient_class: 'from-primary/90 via-primary/70 to-transparent',
        display_order: banners.length,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        subtitle_ar: formData.subtitle_ar || null,
        description: formData.description || null,
        cta_primary_text: formData.cta_primary_text || null,
        cta_primary_link: formData.cta_primary_link || null,
        cta_secondary_text: formData.cta_secondary_text || null,
        cta_secondary_link: formData.cta_secondary_link || null,
        badge_text: formData.badge_text || null,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('hero_banners')
          .update(payload)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('تم تحديث البانر بنجاح');
      } else {
        const { error } = await supabase.from('hero_banners').insert(payload);

        if (error) throw error;
        toast.success('تم إضافة البانر بنجاح');
      }

      setDialogOpen(false);
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;

    try {
      const { error } = await supabase.from('hero_banners').delete().eq('id', id);

      if (error) throw error;
      toast.success('تم حذف البانر بنجاح');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('خطأ في حذف البانر');
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentState ? 'تم إخفاء البانر' : 'تم تفعيل البانر');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('خطأ في تحديث حالة البانر');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex((b) => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1))
      return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...banners];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    try {
      const updates = reordered.map((banner, idx) => ({
        id: banner.id,
        display_order: idx,
      }));

      for (const update of updates) {
        await supabase.from('hero_banners').update({ display_order: update.display_order }).eq('id', update.id);
      }

      toast.success('تم تحديث الترتيب');
      fetchBanners();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('خطأ في تحديث الترتيب');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة البانرات الرئيسية</h1>
            <p className="text-muted-foreground">إدارة شرائح الهيرو الرئيسية</p>
          </div>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة بانر
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>البانرات ({banners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد بانرات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner, index) => (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      !banner.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title_ar}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{banner.title_ar}</h3>
                      <p className="text-sm text-muted-foreground">{banner.subtitle_ar}</p>
                      {banner.badge_text && (
                        <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-1">
                          {banner.badge_text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(banner.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => handleToggleActive(banner.id, banner.is_active)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openDialog(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(banner.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>الصورة</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان *</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>الشعار/Badge</Label>
                  <Input
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="🌙 رمضان كريم"
                  />
                </div>
              </div>

              <div>
                <Label>العنوان الفرعي</Label>
                <Input
                  value={formData.subtitle_ar}
                  onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نص الزر الأساسي</Label>
                  <Input
                    value={formData.cta_primary_text}
                    onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>رابط الزر الأساسي</Label>
                  <Input
                    value={formData.cta_primary_link}
                    onChange={(e) => setFormData({ ...formData, cta_primary_link: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نص الزر الثانوي</Label>
                  <Input
                    value={formData.cta_secondary_text}
                    onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>رابط الزر الثانوي</Label>
                  <Input
                    value={formData.cta_secondary_link}
                    onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>فئة التدرج (Gradient Class)</Label>
                <Input
                  value={formData.gradient_class}
                  onChange={(e) => setFormData({ ...formData, gradient_class: e.target.value })}
                  placeholder="from-primary/90 via-primary/70 to-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>مفعّل</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'جاري الحفظ...' : editingBanner ? 'تحديث' : 'إضافة'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminHeroBanners;