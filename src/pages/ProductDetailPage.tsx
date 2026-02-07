import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Share2, ArrowRight, Check, Truck, Heart } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { toast } from 'sonner';
import { Product, ProductVariant } from '@/types';
import { mapProductRow } from '@/utils/mapProduct';
import {
  getDefaultVariant,
  getVariantOriginalPrice,
  getVariantPrice,
  isVariantInStock,
  isVariantLowStock,
} from '@/utils/productVariants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProductDetailPage = () => {
  const { id } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => (product ? state.isFavorite(product.id) : false));
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // إضافة: state للصورة المعروضة
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('*, categories(name_ar), product_variants(*)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (productData) {
          const mappedProduct = mapProductRow(productData);
          setProduct(mappedProduct);
          // إضافة: تعيين الصورة الأولى كصورة معروضة
          setSelectedImage(mappedProduct.mainImage);

          const activeVariants = mappedProduct.variants.filter((variant) => variant.isActive !== false);
          setVariants(activeVariants);
          setSelectedVariant(getDefaultVariant(activeVariants));

          // Fetch related products
          if (productData.category_id) {
            const { data: relatedData } = await supabase
              .from('products')
              .select('*, categories(name_ar), product_variants(*)')
              .eq('category_id', productData.category_id)
              .eq('is_available', true)
              .neq('id', id)
              .limit(4);

            if (relatedData) {
              setRelatedProducts(relatedData.map(mapProductRow));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="section-container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-10 bg-muted rounded w-3/4" />
                <div className="h-12 bg-muted rounded w-1/3" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="section-container py-20 text-center">
          <div className="text-6xl mb-4">ðŸ”</div>
          <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            العودة للمنتجات
          </Link>
        </div>
      </Layout>
    );
  }

  const currentPrice = getVariantPrice(product, selectedVariant);
  const currentOriginalPrice = getVariantOriginalPrice(product, selectedVariant);
  const totalPrice = currentPrice * quantity;
  const canAddToCart = product.isAvailable && (variants.length === 0 || isVariantInStock(selectedVariant));

  // إضافة: دمج جميع الصور (الرئيسية + الإضافية)
  const allImages = [product.mainImage, ...(product.additionalImages || [])].filter(Boolean);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);
    toast.success('تمت الإضافة إلى السلة', {
      description: `${product.nameAr} - ${selectedVariant?.label || product.unit}`,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.nameAr,
          text: product.shortDescription,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    const wasFavorite = isFavorite;
    toggleFavorite(product.id);
    toast.success(
      wasFavorite ? '?????? ?????????? ???????????? ???? ??????????????' : '?????? ?????????? ???????????? ??????????????'
    );
  };

  return (
    <Layout>
      <div className="section-container py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-primary">المنتجات</Link>
          <span className="mx-2">/</span>
          <Link to={`/products?category=${product.categoryId}`} className="hover:text-primary">
            {product.categoryName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary">{product.nameAr}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* إصلاح: معرض الصور مع الصور الإضافية */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* الصورة الرئيسية */}
            <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
              <img
                src={selectedImage}
                alt={product.nameAr}
                className="w-full h-full object-cover"
              />
              {product.discountPercentage && (
                <span className="absolute top-4 right-4 badge-discount text-lg">
                  -{product.discountPercentage}%
                </span>
              )}
            </div>

            {/* صور مصغرة (Thumbnails) */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === image
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.nameAr} - صورة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Link
                to={`/products?category=${product.categoryId}`}
                className="text-sm text-primary-light font-medium hover:underline"
              >
                {product.categoryName}
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                {product.nameAr}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {currentPrice} جنيه
              </span>
              {currentOriginalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {currentOriginalPrice} جنيه
                </span>
              )}
            </div>

            {/* Availability */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              product.isAvailable
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}>
              <Check className="w-4 h-4" />
              {product.isAvailable ? 'متوفر' : 'غير متوفر'}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Weight Selector */}
            {variants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3"> يمكنك إختيار وزن أقل من كيلو </h3>
                <Select
                  value={selectedVariant?.id}
                  onValueChange={(value) =>
                    setSelectedVariant(variants.find((variant) => variant.id === value))
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="اختر الوزن" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => {
                      const inStock = isVariantInStock(variant);
                      return (
                        <SelectItem key={variant.id} value={variant.id} disabled={!inStock}>
                          {variant.label}  {!inStock ? ' (غير متوفر)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedVariant && isVariantLowStock(selectedVariant) && isVariantInStock(selectedVariant) && (
                  <p className="text-sm text-destructive mt-2">
                    مخزون منخفض — تبقى {selectedVariant.stockQty} فقط
                  </p>
                )}
                {selectedVariant && !isVariantInStock(selectedVariant) && (
                  <p className="text-sm text-destructive mt-2">هذا الوزن غير متوفر حالياً</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">الكمية</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-6 py-2 font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-muted-foreground">
                  الإجمالي: <span className="font-bold text-primary">{totalPrice} جنيه</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                إضافة للسلة
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`p-3 border-2 rounded-xl transition-colors ${
                  isFavorite
                    ? 'border-destructive text-destructive bg-destructive/10'
                    : 'border-border hover:bg-muted'
                }`}
                aria-label="?????????? ??????????????"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 border-2 border-border rounded-xl hover:bg-muted transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <Truck className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium">توصيل سريع</p>
                <p className="text-sm text-muted-foreground">التوصيل خلال ٢٤ ساعة للمنصورة</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-16">
          <div className="flex border-b">
            {[
              { id: 'description', label: 'الوصف الكامل' },
              { id: 'info', label: 'معلومات إضافية' },
              { id: 'returns', label: 'سياسة الإرجاع' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <p className="text-muted-foreground leading-relaxed">
                {product.fullDescription}
              </p>
            )}
            {activeTab === 'info' && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">الوحدة</span>
                  <span className="font-medium">{product.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">القسم</span>
                  <span className="font-medium">{product.categoryName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">الحالة</span>
                  <span className={`font-medium ${product.isAvailable ? 'text-success' : 'text-destructive'}`}>
                    {product.isAvailable ? 'متوفر' : 'غير متوفر'}
                  </span>
                </div>
              </div>
            )}
            {activeTab === 'returns' && (
              <p className="text-muted-foreground leading-relaxed">
                يمكنك إرجاع المنتج خلال ٢٤ ساعة من استلامه في حالة وجود أي عيوب أو عدم مطابقة للمواصفات. يرجى التواصل معنا عبر الواتساب لترتيب عملية الإرجاع.
              </p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">منتجات ذات صلة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
