import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Truck, Shield, BadgePercent } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';
import heroBg from '@/assets/hero-bg.jpg';

// نوع بيانات للعروض (متطابق مع database schema)
interface Offer {
  id: string;
  title_ar: string;
  description: string;
  banner_image: string;
  discount_percentage: number;
  discount_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  type: string;
  priority: number;
}

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الأقسام مع عدد المنتجات
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select(`
            *,
            products:products(count)
          `)
          .eq('is_active', true)
          .order('display_order');

        if (categoriesError) throw categoriesError;

        if (categoriesData) {
          setCategories(
            categoriesData.map((c) => ({
              id: c.id,
              nameAr: c.name_ar,
              slug: c.slug,
              description: c.description,
              icon: c.icon,
              image: c.image_url,
              isActive: c.is_active,
              order: c.display_order,
              // إصلاح: حساب عدد المنتجات من aggregate
              productsCount: c.products?.[0]?.count || 0,
            }))
          );
        }

        // جلب المنتجات المميزة
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, categories(name_ar)')
          .eq('is_available', true)
          .eq('is_featured', true)
          .limit(8);

        if (productsError) throw productsError;

        if (productsData) {
          setFeaturedProducts(
            productsData.map((p) => ({
              id: p.id,
              nameAr: p.name_ar,
              slug: p.slug,
              categoryId: p.category_id || '',
              categoryName: (p.categories as any)?.name_ar || '',
              shortDescription: p.short_description || '',
              fullDescription: p.full_description || '',
              basePrice: Number(p.base_price),
              originalPrice: p.original_price ? Number(p.original_price) : undefined,
              unit: p.unit,
              sizes: [],
              mainImage: p.main_image || '',
              additionalImages: p.additional_images || [],
              isAvailable: p.is_available,
              isFeatured: p.is_featured,
              discountPercentage: p.discount_percentage || undefined,
            }))
          );
        }

        // إصلاح: جلب العروض من database
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (offersError) {
          console.error('Error fetching offers:', offersError);
        } else if (offersData) {
          console.log('📢 Offers fetched from DB:', offersData);
          console.log('📅 Current date:', new Date().toISOString());
          
          // فلترة العروض يدوياً حسب التاريخ
          const currentDate = new Date();
          const validOffers = offersData.filter(offer => {
            const endDate = new Date(offer.end_date);
            const startDate = new Date(offer.start_date);
            const isValid = currentDate >= startDate && currentDate <= endDate;
            
            console.log(`Offer "${offer.title_ar}":`, {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              currentDate: currentDate.toISOString(),
              isValid
            });
            
            return isValid;
          });
          
          console.log('✅ Valid offers after date filtering:', validOffers.length);
          setOffers(validOffers);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'منتجات طازجة وطبيعية',
      description: 'نقدم لك منتجات طبيعية 100% بدون أي إضافات',
    },
    {
      icon: <BadgePercent className="w-8 h-8" />,
      title: 'أسعار تنافسية',
      description: 'أفضل الأسعار مع عروض حصرية لشهر رمضان',
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'توصيل سريع',
      description: 'توصيل سريع لجميع مناطق الدقهلية',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'جودة مضمونة',
      description: 'ضمان الجودة واسترجاع المنتج في حالة عدم الرضا',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Ramadan products"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative section-container py-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="text-xl">🌙</span>
                رمضان كريم
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6"
            >
              أجود المنتجات
              <br />
              <span className="text-primary">الطبيعية</span> لرمضان
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              تمور فاخرة، عسل طبيعي، مكسرات محمصة، وياميش رمضان. كل ما تحتاجه لمائدة رمضانية مميزة بجودة عالية وأسعار منافسة.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/products"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg"
              >
                تصفح المنتجات
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/201276166532"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center justify-center gap-2 text-lg"
              >
                اطلب الآن عبر واتساب
              </a>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* إضافة: Offers Slider Section */}
      {offers.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="section-container">
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-3"
              >
                <span className="text-primary">عروض</span> رمضان الحصرية
              </motion.h2>
              <p className="text-muted-foreground">لا تفوت فرصة الحصول على أفضل العروض</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                >
                  {/* صورة العرض */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={offer.banner_image}
                      alt={offer.title_ar}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {offer.discount_percentage && (
                      <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-bold text-lg">
                        خصم {offer.discount_percentage}%
                      </div>
                    )}
                  </div>
                  
                  {/* تفاصيل العرض */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {offer.title_ar}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {offer.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-EG')}</span>
                      <Link 
                        to="/products" 
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        تسوق الآن ←
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="section-container">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              تصفح <span className="text-primary">الأقسام</span>
            </motion.h2>
            <p className="text-muted-foreground">اختر من تشكيلتنا المتنوعة من المنتجات</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              >
                منتجاتنا <span className="text-primary">المميزة</span>
              </motion.h2>
              <p className="text-muted-foreground">أكثر المنتجات طلباً في متجرنا</p>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition-colors"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2"
            >
              عرض جميع المنتجات
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-b from-accent/50 to-background pattern-overlay">
        <div className="section-container">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              لماذا <span className="text-primary">مذاق</span>؟
            </motion.h2>
            <p className="text-muted-foreground">نحرص على تقديم أفضل تجربة تسوق لعملائنا</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-5xl mb-4 block">🌙</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              رمضان كريم
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              استعد لشهر رمضان المبارك مع أجود المنتجات الطبيعية. اطلب الآن واستمتع بتوصيل سريع لمنزلك.
            </p>
            <Link
              to="/products"
              className="btn-gold inline-flex items-center gap-2 text-lg"
            >
              تسوق الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;