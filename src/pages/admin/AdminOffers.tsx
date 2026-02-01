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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ImageUpload from '@/components/admin/ImageUpload';

interface Offer {
  id: string;
  title_ar: string;
  description: string | null;
  type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
}

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    description: '',
    type: 'percentage',
    discount_percentage: '',
    discount_amount: '',
    banner_image: '',
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 0,
  });

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('خطأ في تحميل العروض');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setFormData({
      title_ar: '',
      description: '',
      type: 'percentage',
      discount_percentage: '',
      discount_amount: '',
      banner_image: '',
      start_date: '',
      end_date: '',
      is_active: true,
      priority: 0,
    });
    setEditingOffer(null);
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title_ar: offer.title_ar,
      description: offer.description || '',
      type: offer.type,
      discount_percentage: offer.discount_percentage ? String(offer.discount_percentage) : '',
      discount_amount: offer.discount_amount ? String(offer.discount_amount) : '',
      banner_image: offer.banner_image || '',
      start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
      is_active: offer.is_active,
      priority: offer.priority,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const offerData = {
        title_ar: formData.title_ar,
        description: formData.description || null,
        type: formData.type,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        banner_image: formData.banner_image || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        priority: formData.priority,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast.success('تم تحديث العرض بنجاح');
      } else {
        const { error } = await supabase.from('offers').insert([offerData]);

        if (error) throw error;
        toast.success('تم إضافة العرض بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(error.message || 'خطأ في حفظ العرض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);

      if (error) throw error;
      toast.success('تم حذف العرض بنجاح');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('خطأ في حذف العرض');
    }
  };

  const getOfferTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      percentage: 'خصم نسبة',
      fixed: 'خصم ثابت',
      bogo: 'اشترِ واحصل',
      free_shipping: 'شحن مجاني',
      custom: 'عرض مخصص',
    };
    return types[type] || type;
  };

  const filteredOffers = offers.filter((offer) =>
    offer.title_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة العروض</h1>
            <p className="text-muted-foreground">إضافة وتعديل العروض والخصومات</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عرض
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title_ar">عنوان العرض *</Label>
                  <Input
                    id="title_ar"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف العرض</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">نوع العرض</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">خصم نسبة</SelectItem>
                        <SelectItem value="fixed">خصم ثابت</SelectItem>
                        <SelectItem value="bogo">اشترِ واحصل</SelectItem>
                        <SelectItem value="free_shipping">شحن مجاني</SelectItem>
                        <SelectItem value="custom">عرض مخصص</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">الأولوية</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">نسبة الخصم %</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">مبلغ الخصم</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">تاريخ البداية</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">تاريخ النهاية</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>صورة البانر</Label>
                  <ImageUpload
                    value={formData.banner_image}
                    onChange={(url) => setFormData({ ...formData, banner_image: url })}
                    folder="offers"
                  />
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
                    {isSubmitting ? 'جاري الحفظ...' : editingOffer ? 'حفظ التعديلات' : 'إضافة العرض'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في العروض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredOffers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              لا توجد عروض
            </div>
          ) : (
            filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={!offer.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{offer.title_ar}</h3>
                        </div>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {offer.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getOfferTypeLabel(offer.type)}
                          </span>
                          {offer.discount_percentage && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {offer.discount_percentage}% خصم
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {offer.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                        {(offer.start_date || offer.end_date) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {offer.start_date && `من ${format(new Date(offer.start_date), 'dd MMM yyyy', { locale: ar })}`}
                            {offer.end_date && ` إلى ${format(new Date(offer.end_date), 'dd MMM yyyy', { locale: ar })}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(offer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(offer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
