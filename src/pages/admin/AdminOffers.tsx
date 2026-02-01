import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Tag, Gift, Percent, TruckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ImageUpload from '@/components/admin/ImageUpload';
import { Offer, OfferType, Category } from '@/types';

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name_ar: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    description: '',
    type: 'percentage' as OfferType,
    discount_percentage: '',
    discount_amount: '',
    min_quantity: '',
    free_quantity: '',
    min_amount: '',
    applicable_products: [] as string[],
    applicable_categories: [] as string[],
    banner_image: '',
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 0,
    auto_apply: true,
  });

  const fetchData = async () => {
    try {
      const [offersRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from('offers').select('*').order('priority', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true),
        supabase.from('products').select('id, name_ar').eq('is_available', true),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;

      // تحويل العروض
      const mappedOffers: Offer[] = (offersRes.data || []).map((offer: any) => ({
        id: offer.id,
        title_ar: offer.title_ar,
        description: offer.description,
        type: offer.type,
        discount_percentage: offer.discount_percentage,
        discount_amount: offer.discount_amount,
        min_quantity: offer.min_quantity ?? null,
        free_quantity: offer.free_quantity ?? null,
        min_amount: offer.min_amount ?? null,
        applicable_products: offer.applicable_products ?? null,
        applicable_categories: offer.applicable_categories ?? null,
        banner_image: offer.banner_image,
        start_date: offer.start_date,
        end_date: offer.end_date,
        is_active: offer.is_active,
        priority: offer.priority,
        auto_apply: offer.auto_apply ?? true,
        created_at: offer.created_at,
        updated_at: offer.updated_at,
      }));
      
      setOffers(mappedOffers);
      
      setCategories(
        (categoriesRes.data || []).map(c => ({
          id: c.id,
          nameAr: c.name_ar,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          image: c.image_url,
          isActive: c.is_active,
          order: c.display_order,
          productsCount: 0,
        }))
      );
      
      // حفظ المنتجات كما هي
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      title_ar: '',
      description: '',
      type: 'percentage',
      discount_percentage: '',
      discount_amount: '',
      min_quantity: '',
      free_quantity: '',
      min_amount: '',
      applicable_products: [],
      applicable_categories: [],
      banner_image: '',
      start_date: '',
      end_date: '',
      is_active: true,
      priority: 0,
      auto_apply: true,
    });
    setEditingOffer(null);
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title_ar: offer.title_ar,
      description: offer.description || '',
      type: offer.type,
      discount_percentage: offer.discount_percentage?.toString() || '',
      discount_amount: offer.discount_amount?.toString() || '',
      min_quantity: offer.min_quantity?.toString() || '',
      free_quantity: offer.free_quantity?.toString() || '',
      min_amount: offer.min_amount?.toString() || '',
      applicable_products: offer.applicable_products || [],
      applicable_categories: offer.applicable_categories || [],
      banner_image: offer.banner_image || '',
      start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
      is_active: offer.is_active,
      priority: offer.priority,
      auto_apply: offer.auto_apply,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const offerData: any = {
        title_ar: formData.title_ar,
        description: formData.description || null,
        type: formData.type,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        min_quantity: formData.min_quantity ? parseInt(formData.min_quantity) : null,
        free_quantity: formData.free_quantity ? parseInt(formData.free_quantity) : null,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
        applicable_products: formData.applicable_products.length > 0 ? formData.applicable_products : null,
        applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : null,
        banner_image: formData.banner_image || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        priority: formData.priority,
        auto_apply: formData.auto_apply,
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
      fetchData();
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
      fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('خطأ في حذف العرض');
    }
  };

  const getOfferTypeLabel = (type: string) => {
    const types: Record<string, { label: string; icon: any }> = {
      percentage: { label: 'خصم نسبة مئوية', icon: Percent },
      fixed: { label: 'خصم ثابت', icon: Tag },
      bogo: { label: 'اشتري واحد واحصل على الثاني', icon: Gift },
      buy_x_get_y: { label: 'اشتري X واحصل على Y', icon: Gift },
      free_shipping: { label: 'شحن مجاني', icon: TruckIcon },
      category_discount: { label: 'خصم على قسم', icon: Percent },
      custom: { label: 'عرض مخصص', icon: Tag },
    };
    return types[type] || { label: type, icon: Tag };
  };

  const filteredOffers = offers.filter((offer) =>
    offer.title_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // حساب الحقول المطلوبة حسب نوع العرض
  const getRequiredFields = () => {
    switch (formData.type) {
      case 'percentage':
      case 'category_discount':
        return ['discount_percentage'];
      case 'fixed':
        return ['discount_amount'];
      case 'buy_x_get_y':
        return ['min_quantity', 'free_quantity'];
      case 'free_shipping':
        return ['min_amount'];
      case 'bogo':
        return [];
      default:
        return [];
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة العروض</h1>
            <p className="text-muted-foreground">إضافة وتعديل العروض والخصومات</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عرض
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* العنوان */}
                <div className="space-y-2">
                  <Label htmlFor="title_ar">عنوان العرض *</Label>
                  <Input
                    id="title_ar"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    required
                    placeholder="مثال: خصم 20% على جميع المنتجات"
                  />
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                  <Label htmlFor="description">وصف العرض</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="تفاصيل إضافية عن العرض..."
                  />
                </div>

                {/* نوع العرض والأولوية */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">نوع العرض *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: OfferType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">خصم نسبة مئوية</SelectItem>
                        <SelectItem value="fixed">خصم ثابت</SelectItem>
                        <SelectItem value="buy_x_get_y">اشتري X واحصل على Y</SelectItem>
                        <SelectItem value="bogo">اشتري واحد واحصل على الثاني</SelectItem>
                        <SelectItem value="free_shipping">شحن مجاني</SelectItem>
                        <SelectItem value="category_discount">خصم على قسم</SelectItem>
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

                {/* حقول حسب نوع العرض */}
                {(formData.type === 'percentage' || formData.type === 'category_discount') && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">نسبة الخصم % *</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      required
                    />
                  </div>
                )}

                {formData.type === 'fixed' && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">مبلغ الخصم (جنيه) *</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      required
                    />
                  </div>
                )}

                {formData.type === 'buy_x_get_y' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_quantity">اشتري (عدد) *</Label>
                      <Input
                        id="min_quantity"
                        type="number"
                        min="1"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                        placeholder="مثال: 4"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="free_quantity">واحصل على (عدد) *</Label>
                      <Input
                        id="free_quantity"
                        type="number"
                        min="1"
                        value={formData.free_quantity}
                        onChange={(e) => setFormData({ ...formData, free_quantity: e.target.value })}
                        placeholder="مثال: 1"
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'free_shipping' && (
                  <div className="space-y-2">
                    <Label htmlFor="min_amount">الحد الأدنى للمبلغ (جنيه) *</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      step="0.01"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      placeholder="مثال: 500"
                      required
                    />
                  </div>
                )}

                {/* اختيار المنتجات */}
                {formData.type !== 'category_discount' && formData.type !== 'free_shipping' && (
                  <div className="space-y-2">
                    <Label>المنتجات المطبق عليها العرض (اختياري)</Label>
                    <p className="text-xs text-muted-foreground">
                      اترك فارغاً للتطبيق على جميع المنتجات
                    </p>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={formData.applicable_products.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  applicable_products: [...formData.applicable_products, product.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  applicable_products: formData.applicable_products.filter(
                                    (id) => id !== product.id
                                  ),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`product-${product.id}`} className="cursor-pointer">
                            {(product as any).name_ar}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* اختيار الأقسام */}
                {formData.type !== 'free_shipping' && (
                  <div className="space-y-2">
                    <Label>الأقسام المطبق عليها العرض (اختياري)</Label>
                    <p className="text-xs text-muted-foreground">
                      اترك فارغاً للتطبيق على جميع الأقسام
                    </p>
                    <div className="border rounded-lg p-3 space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={formData.applicable_categories.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  applicable_categories: [...formData.applicable_categories, category.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  applicable_categories: formData.applicable_categories.filter(
                                    (id) => id !== category.id
                                  ),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                            {category.nameAr}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* التواريخ */}
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

                {/* صورة البانر */}
                <div className="space-y-2">
                  <Label>صورة البانر</Label>
                  <ImageUpload
                    value={formData.banner_image}
                    onChange={(url) => setFormData({ ...formData, banner_image: url })}
                    folder="offers"
                  />
                </div>

                {/* الإعدادات */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="auto_apply"
                      checked={formData.auto_apply}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
                    />
                    <Label htmlFor="auto_apply">تطبيق تلقائي في السلة</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">نشط</Label>
                  </div>
                </div>

                {/* الأزرار */}
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
            <div className="col-span-full text-center py-8 text-muted-foreground">لا توجد عروض</div>
          ) : (
            filteredOffers.map((offer, index) => {
              const typeInfo = getOfferTypeLabel(offer.type);
              const Icon = typeInfo.icon;
              
              return (
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
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{offer.title_ar}</h3>
                          </div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {offer.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {typeInfo.label}
                            </span>
                            {offer.discount_percentage && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {offer.discount_percentage}% خصم
                              </span>
                            )}
                            {offer.discount_amount && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                خصم {offer.discount_amount} جنيه
                              </span>
                            )}
                            {offer.auto_apply && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                تلقائي
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
                              {offer.start_date &&
                                `من ${format(new Date(offer.start_date), 'dd MMM yyyy', { locale: ar })}`}
                              {offer.end_date &&
                                ` إلى ${format(new Date(offer.end_date), 'dd MMM yyyy', { locale: ar })}`}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(offer)}>
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
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;