import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface DeliveryArea {
  id: string;
  city: string;
  area: string;
  delivery_fee: number;
  delivery_time: string | null;
  is_active: boolean;
}

const AdminDeliveryAreas = () => {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    city: '',
    area: '',
    delivery_fee: '',
    delivery_time: '',
    is_active: true,
  });

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .order('city');

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error('Error fetching delivery areas:', error);
      toast.error('خطأ في تحميل مناطق التوصيل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const resetForm = () => {
    setFormData({
      city: '',
      area: '',
      delivery_fee: '',
      delivery_time: '',
      is_active: true,
    });
    setEditingArea(null);
  };

  const openEditDialog = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      city: area.city,
      area: area.area,
      delivery_fee: String(area.delivery_fee),
      delivery_time: area.delivery_time || '',
      is_active: area.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const areaData = {
        city: formData.city,
        area: formData.area,
        delivery_fee: parseFloat(formData.delivery_fee),
        delivery_time: formData.delivery_time || null,
        is_active: formData.is_active,
      };

      if (editingArea) {
        const { error } = await supabase
          .from('delivery_areas')
          .update(areaData)
          .eq('id', editingArea.id);

        if (error) throw error;
        toast.success('تم تحديث منطقة التوصيل بنجاح');
      } else {
        const { error } = await supabase.from('delivery_areas').insert([areaData]);

        if (error) throw error;
        toast.success('تم إضافة منطقة التوصيل بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      fetchAreas();
    } catch (error: any) {
      console.error('Error saving delivery area:', error);
      toast.error(error.message || 'خطأ في حفظ منطقة التوصيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف منطقة التوصيل هذه؟')) return;

    try {
      const { error } = await supabase.from('delivery_areas').delete().eq('id', id);

      if (error) throw error;
      toast.success('تم حذف منطقة التوصيل بنجاح');
      fetchAreas();
    } catch (error) {
      console.error('Error deleting delivery area:', error);
      toast.error('خطأ في حذف منطقة التوصيل');
    }
  };

  // Group areas by city
  const groupedAreas = areas.reduce((acc, area) => {
    if (!acc[area.city]) {
      acc[area.city] = [];
    }
    acc[area.city].push(area);
    return acc;
  }, {} as Record<string, DeliveryArea[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مناطق التوصيل</h1>
            <p className="text-muted-foreground">إدارة مناطق ورسوم التوصيل</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منطقة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingArea ? 'تعديل منطقة التوصيل' : 'إضافة منطقة توصيل جديدة'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="المنصورة"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">المنطقة *</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="وسط البلد"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">رسوم التوصيل *</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                      placeholder="25"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">مدة التوصيل</Label>
                    <Input
                      id="delivery_time"
                      value={formData.delivery_time}
                      onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                      placeholder="خلال ٢٤ ساعة"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">نشط</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : editingArea ? 'حفظ التعديلات' : 'إضافة المنطقة'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Areas by City */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : Object.keys(groupedAreas).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              لا توجد مناطق توصيل
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAreas).map(([city, cityAreas], cityIndex) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: cityIndex * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {city}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">المنطقة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">رسوم التوصيل</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">مدة التوصيل</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cityAreas.map((area) => (
                            <tr key={area.id} className="border-b last:border-0">
                              <td className="py-2 px-2 font-medium">{area.area}</td>
                              <td className="py-2 px-2">{Number(area.delivery_fee).toLocaleString('ar-EG')} ج.م</td>
                              <td className="py-2 px-2 text-muted-foreground">{area.delivery_time || '-'}</td>
                              <td className="py-2 px-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    area.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {area.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(area)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(area.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryAreas;
