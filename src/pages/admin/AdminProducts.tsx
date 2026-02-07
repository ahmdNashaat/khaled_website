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
import { Plus, Pencil, Trash2, Search, Package, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import MultiImageUpload from '@/components/admin/MultiImageUpload';

interface Category {
  id: string;
  name_ar: string;
  slug: string;
}

interface Product {
  id: string;
  name_ar: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  base_price: number;
  original_price: number | null;
  unit: string;
  main_image: string | null;
  additional_images: string[] | null;
  is_available: boolean;
  is_featured: boolean;
  featured_order: number | null;
  discount_percentage: number | null;
  categories?: Category;
}

interface VariantForm {
  id?: string;
  label: string;
  weight_grams: string;
  price: string;
  original_price: string;
  stock_qty: string;
  low_stock_threshold: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [variantsError, setVariantsError] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const weightPresets = [
    { label: '250 جرام', grams: 250 },
    { label: '500 جرام', grams: 500 },
    { label: '1 كيلو', grams: 1000 },
    { label: '2 كيلو', grams: 2000 },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name_ar: '',
    slug: '',
    category_id: '',
    short_description: '',
    full_description: '',
    base_price: '',
    original_price: '',
    unit: 'كيلو',
    main_image: '',
    additional_images: [] as string[],
    is_available: true,
    is_featured: false,
    featured_order: '',
    discount_percentage: '',
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name_ar, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('خطأ في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_ar, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name_ar: '',
      slug: '',
      category_id: '',
      short_description: '',
      full_description: '',
      base_price: '',
      original_price: '',
      unit: 'كيلو',
      main_image: '',
      additional_images: [],
      is_available: true,
      is_featured: false,
      featured_order: '',
      discount_percentage: '',
    });
    setVariants([]);
    setVariantsError('');
    setFormError('');
    setEditingProduct(null);
  };

  const syncDefaultPricing = (nextVariants: VariantForm[]) => {
    const activeVariants = nextVariants.filter((variant) => variant.is_active);
    const defaultVariant =
      activeVariants.find((variant) => variant.is_default) || activeVariants[0];

    if (defaultVariant) {
      setFormData((prev) => ({
        ...prev,
        base_price: defaultVariant.price,
        original_price: defaultVariant.original_price || '',
      }));
    }
  };

  const applyVariantUpdate = (nextVariants: VariantForm[]) => {
    setVariants(nextVariants);
    syncDefaultPricing(nextVariants);
    if (variantsError) setVariantsError('');
  };

  const validateVariants = (nextVariants: VariantForm[]) => {
    const activeVariants = nextVariants.filter((variant) => variant.is_active);
    if (activeVariants.length === 0) {
      return 'ضروري إضافة وزن واحد من الأقل';
    }
    if (!activeVariants.some((variant) => variant.is_default)) {
      return 'اختر وزن افتراضي';
    }
    const invalidVariant = activeVariants.find(
      (variant) => !variant.label.trim() || !variant.price
    );
    if (invalidVariant) {
      return 'يرجى إدخال الوزن والسعر لكل الأوزان النشطة';
    }
    return '';
  };

  const addVariant = () => {
    applyVariantUpdate([
      ...variants,
      {
        label: '',
        weight_grams: '',
        price: '',
        original_price: '',
        stock_qty: '',
        low_stock_threshold: '',
        is_default: variants.length === 0,
        is_active: true,
        sort_order: variants.length,
      },
    ]);
  };

  const addPresetVariant = (preset: { label: string; grams: number }) => {
    applyVariantUpdate([
      ...variants,
      {
        label: preset.label,
        weight_grams: String(preset.grams),
        price: '',
        original_price: '',
        stock_qty: '',
        low_stock_threshold: '',
        is_default: variants.length === 0,
        is_active: true,
        sort_order: variants.length,
      },
    ]);
  };

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    if (patch.is_active === false && next[index].is_default) {
      next[index].is_default = false;
      const fallbackIndex = next.findIndex((variant, idx) => idx !== index && variant.is_active);
      if (fallbackIndex >= 0) {
        next[fallbackIndex].is_default = true;
      }
    }
    applyVariantUpdate(next);
  };

  const setDefaultVariant = (index: number) => {
    const next = variants.map((variant, idx) => ({
      ...variant,
      is_default: idx === index,
    }));
    applyVariantUpdate(next);
  };

  const removeVariant = (index: number) => {
    const target = variants[index];
    if (target?.id) {
      updateVariant(index, { is_active: false, is_default: false });
      return;
    }
    const next = variants.filter((_, idx) => idx !== index);
    applyVariantUpdate(next);
  };

  const moveVariant = (index: number, direction: 'up' | 'down') => {
    const next = [...variants];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const reindexed = next.map((variant, idx) => ({
      ...variant,
      sort_order: idx,
    }));
    applyVariantUpdate(reindexed);
  };

  const reorderVariants = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...variants];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const reindexed = next.map((variant, idx) => ({
      ...variant,
      sort_order: idx,
    }));
    applyVariantUpdate(reindexed);
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      slug: product.slug,
      category_id: product.category_id || '',
      short_description: product.short_description || '',
      full_description: product.full_description || '',
      base_price: String(product.base_price),
      original_price: product.original_price ? String(product.original_price) : '',
      unit: product.unit,
      main_image: product.main_image || '',
      additional_images: product.additional_images || [],
      is_available: product.is_available,
      is_featured: product.is_featured,
      featured_order: product.featured_order ? String(product.featured_order) : '',
      discount_percentage: product.discount_percentage ? String(product.discount_percentage) : '',
    });
    setVariantsError('');
    setFormError('');

    try {
      const { data: variantsData, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true })
        .order('price', { ascending: true });

      if (error) throw error;

      if (variantsData && variantsData.length > 0) {
        applyVariantUpdate(
          variantsData.map((variant, index) => ({
            id: variant.id,
            label: variant.label,
            weight_grams: variant.weight_grams ? String(variant.weight_grams) : '',
            price: variant.price ? String(variant.price) : '',
            original_price: variant.original_price ? String(variant.original_price) : '',
            stock_qty: variant.stock_qty ? String(variant.stock_qty) : '',
            low_stock_threshold: variant.low_stock_threshold ? String(variant.low_stock_threshold) : '',
            is_default: variant.is_default ?? false,
            is_active: variant.is_active ?? true,
            sort_order: variant.sort_order ?? index,
          }))
        );
      } else {
        applyVariantUpdate([
          {
            label: product.unit || 'افتراضي',
            weight_grams: '',
            price: String(product.base_price),
            original_price: product.original_price ? String(product.original_price) : '',
            stock_qty: '',
            low_stock_threshold: '',
            is_default: true,
            is_active: true,
            sort_order: 0,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast.error('خطأ في تحميل الأوزان');
    }

    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const variantValidationError = validateVariants(variants);
      if (variantValidationError) {
        setVariantsError(variantValidationError);
        setIsSubmitting(false);
        return;
      }

      const activeVariants = variants.filter((variant) => variant.is_active);
      const defaultVariant =
        activeVariants.find((variant) => variant.is_default) || activeVariants[0];

      setVariantsError('');
      const basePriceValue = defaultVariant?.price
        ? parseFloat(defaultVariant.price)
        : parseFloat(formData.base_price);
      const originalPriceValue = defaultVariant?.original_price
        ? parseFloat(defaultVariant.original_price)
        : formData.original_price
          ? parseFloat(formData.original_price)
          : null;

      const productData = {
        name_ar: formData.name_ar,
        slug: formData.slug || formData.name_ar.toLowerCase().replace(/\s+/g, '-'),
        category_id: formData.category_id || null,
        short_description: formData.short_description || null,
        full_description: formData.full_description || null,
        base_price: basePriceValue,
        original_price: originalPriceValue,
        unit: formData.unit,
        main_image: formData.main_image || null,
        additional_images: formData.additional_images.length > 0 ? formData.additional_images : null,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        featured_order: formData.featured_order ? parseInt(formData.featured_order) : null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
      };

      let productId = editingProduct?.id;

      const normalizedSlug = productData.slug.trim();
      if (normalizedSlug) {
        const { data: slugMatches, error: slugError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', normalizedSlug)
          .limit(1);

        if (slugError) throw slugError;

        const conflict = slugMatches?.find((row) => row.id !== editingProduct?.id);
        if (conflict) {
          setFormError('الرابط (Slug) مستخدم مسبقاً. يرجى اختيار رابط مختلف.');
          setIsSubmitting(false);
          return;
        }
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const { data: createdProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();

        if (error) throw error;
        productId = createdProduct?.id;
        toast.success('تم إضافة المنتج بنجاح');
      }

      if (!productId) {
        throw new Error('Product ID is missing');
      }

      const preparedVariants = variants
        .filter((variant) => variant.is_active || variant.id)
        .map((variant, index) => ({
          ...variant,
          sort_order: Number.isFinite(variant.sort_order) ? variant.sort_order : index,
          is_default: defaultVariant?.id
            ? variant.id === defaultVariant.id
            : variant === defaultVariant,
        }));

      const variantsToUpdate = preparedVariants.filter((variant) => variant.id);
      const variantsToInsert = preparedVariants.filter((variant) => !variant.id);

      if (variantsToUpdate.length > 0) {
        const updateRows = variantsToUpdate.map((variant) => ({
          id: variant.id,
          product_id: productId,
          label: variant.label.trim(),
          weight_grams: variant.weight_grams ? parseInt(variant.weight_grams) : null,
          price: variant.price ? parseFloat(variant.price) : 0,
          original_price: variant.original_price ? parseFloat(variant.original_price) : null,
          stock_qty: variant.stock_qty ? parseInt(variant.stock_qty) : null,
          low_stock_threshold: variant.low_stock_threshold ? parseInt(variant.low_stock_threshold) : null,
          is_default: variant.is_default,
          is_active: variant.is_active,
          sort_order: variant.sort_order,
        }));

        const { error: updateError } = await supabase
          .from('product_variants')
          .upsert(updateRows, { onConflict: 'id' });

        if (updateError) throw updateError;
      }

      if (variantsToInsert.length > 0) {
        const insertRows = variantsToInsert.map((variant) => ({
          product_id: productId,
          label: variant.label.trim(),
          weight_grams: variant.weight_grams ? parseInt(variant.weight_grams) : null,
          price: variant.price ? parseFloat(variant.price) : 0,
          original_price: variant.original_price ? parseFloat(variant.original_price) : null,
          stock_qty: variant.stock_qty ? parseInt(variant.stock_qty) : null,
          low_stock_threshold: variant.low_stock_threshold ? parseInt(variant.low_stock_threshold) : null,
          is_default: variant.is_default,
          is_active: variant.is_active,
          sort_order: variant.sort_order,
        }));

        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(insertRows);

        if (insertError) throw insertError;
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'خطأ في حفظ المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;
      toast.success('تم حذف المنتج بنجاح');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('خطأ في حذف المنتج');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة المنتجات</h1>
            <p className="text-muted-foreground">إضافة وتعديل المنتجات</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">اسم المنتج *</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">الرابط (Slug)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="يُملأ تلقائياً"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">القسم</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">الوحدة</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="كيلو">كيلو</SelectItem>
                        <SelectItem value="قطعة">قطعة</SelectItem>
                        <SelectItem value="علبة">علبة</SelectItem>
                        <SelectItem value="كيس">كيس</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">سعر الوزن الافتراضي *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      readOnly
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price">السعر الأصلي (للوزن الافتراضي)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      readOnly
                    />
                  </div>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">وصف قصير</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_description">الوصف الكامل</Label>
                  <Textarea
                    id="full_description"
                    rows={3}
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الصورة الرئيسية</Label>
                  <ImageUpload
                    value={formData.main_image}
                    onChange={(url) => setFormData({ ...formData, main_image: url })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الصور الإضافية (حتى 5 صور)</Label>
                  <MultiImageUpload
                    value={formData.additional_images}
                    onChange={(urls) => setFormData({ ...formData, additional_images: urls })}
                    maxImages={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>الأوزان والأسعار</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة وزن
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {weightPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => addPresetVariant(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  {variantsError && (
                    <p className="text-sm text-destructive">{variantsError}</p>
                  )}

                  <div className="space-y-3">
                    {variants.map((variant, index) => {
                      const isDisabled = !variant.is_active;
                      return (
                        <div
                          key={variant.id || `variant-${index}`}
                          draggable
                          onDragStart={() => setDraggingIndex(index)}
                          onDragEnd={() => setDraggingIndex(null)}
                          onDragOver={(event) => {
                            event.preventDefault();
                          }}
                          onDrop={() => {
                            if (draggingIndex === null) return;
                            reorderVariants(draggingIndex, index);
                            setDraggingIndex(null);
                          }}
                          className={`rounded-lg border p-3 space-y-3 ${isDisabled ? 'opacity-60' : ''} ${draggingIndex === index ? 'border-primary/70 bg-primary/5' : ''}`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                            <div className="space-y-2 md:col-span-2">
                              <Label>الوزن *</Label>
                              <Input
                                value={variant.label}
                                onChange={(e) => updateVariant(index, { label: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>الوزن (جرام) </Label>
                              <Input
                                type="number"
                                value={variant.weight_grams}
                                onChange={(e) => updateVariant(index, { weight_grams: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>السعر *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, { price: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>السعر قبل الخصم</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.original_price}
                                onChange={(e) => updateVariant(index, { original_price: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>المخزون</Label>
                              <Input
                                type="number"
                                value={variant.stock_qty}
                                onChange={(e) => updateVariant(index, { stock_qty: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>نقطة مخزون منخفض</Label>
                              <Input
                                type="number"
                                value={variant.low_stock_threshold}
                                onChange={(e) => updateVariant(index, { low_stock_threshold: e.target.value })}
                                disabled={isDisabled}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name="default_variant"
                                checked={variant.is_default}
                                onChange={() => setDefaultVariant(index)}
                                disabled={isDisabled}
                              />
                              الوزن الافتراضي
                            </label>

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={variant.is_active}
                                onCheckedChange={(checked) => updateVariant(index, { is_active: checked })}
                              />
                              <span className="text-sm">
                                {variant.is_active ? 'نشط' : 'مخفي'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveVariant(index, 'up')}
                                disabled={index === 0}
                                aria-label="Move up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveVariant(index, 'down')}
                                disabled={index === variants.length - 1}
                                aria-label="Move down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => removeVariant(index)}
                              >
                                {variant.id ? 'إخفاء' : 'إزالة'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                    <Label htmlFor="is_available">متوفر</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">منتج مميز</Label>
                  </div>
                </div>


                {formData.is_featured && (
                  <div className="space-y-2">
                    <Label htmlFor="featured_order">ترتيب العرض</Label>
                    <Input
                      id="featured_order"
                      type="number"
                      min="1"
                      value={formData.featured_order}
                      onChange={(e) => setFormData({ ...formData, featured_order: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
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
            placeholder="البحث في المنتجات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              المنتجات ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد منتجات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الصورة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الترتيب</th>

                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">القسم</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 px-2">
                          {product.main_image ? (
                            <img
                              src={product.main_image}
                              alt={product.name_ar}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {product.is_featured ? (product.featured_order ?? '-') : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{product.name_ar}</p>
                            {product.is_featured && (
                              <span className="text-xs text-primary">★ مميز</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {product.categories?.name_ar || '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{Number(product.base_price).toLocaleString('ar-EG')} ج.م</p>
                            {product.discount_percentage && (
                              <span className="text-xs text-destructive">-{product.discount_percentage}%</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.is_available ? 'متوفر' : 'غير متوفر'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
