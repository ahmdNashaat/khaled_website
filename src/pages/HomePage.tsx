import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Truck, Shield, BadgePercent, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

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

// Hero Slides Data
const heroSlides = [
  {
    id: 1,
    image: '/hero-slide-1.jpg', // صورة التمور مع العسل والمكسرات
    badge: '🌙 رمضان كريم',
    title: 'أجود المنتجات الطبيعية لرمضان',
    subtitle: 'تمور فاخرة • عسل طبيعي • مكسرات محمصة',
    description: 'كل ما تحتاجه لمائدة رمضانية مميزة بجودة عالية وأسعار منافسة',
    ctaPrimary: { text: 'تصفح المنتجات', link: '/products' },
    ctaSecondary: { text: 'اطلب عبر واتساب', link: 'https://wa.me/+201276166532' },
  },
  {
    id: 2,
    image: '/hero-slide-2.jpg', // صورة التمور الطازجة
    badge: '✨ عروض خاصة',
    title: 'تمور عربية فاخرة',
    subtitle: 'من أرقى المزارع السعودية',
    description: 'تمور طازجة ومختارة بعناية لتقديم أفضل طعم فريد لكم',
    ctaPrimary: { text: 'تسوق التمور', link: '/products' },
    ctaSecondary: { text: 'اطلب الآن', link: 'https://wa.me/+201276166532' },
  },
  {
    id: 3,
    image: '/hero-slide-3.jpg', // صورة التمور في الوعاء
    badge: '🎁 هدايا مميزة',
    title: 'أسهل مكان للعثور على هدايا المناسبات',
    subtitle: 'مجموعات هدايا فاخرة',
    description: 'باقات مميزة من التمور والعسل والمكسرات مغلفة بأناقة',
    ctaPrimary: { text: 'استكشف الهدايا', link: '/products' },
    ctaSecondary: { text: 'تواصل معنا', link: 'https://wa.me/+201276166532' },
  },
    {
    id: 4,
    image: '/hero-slide-4.jpg', // صورة صورة المكسرات
    badge: '🎁 هدايا مميزة',
    title: 'أسهل مكان للعثور على هدايا المناسبات',
    subtitle: 'مجموعات هدايا فاخرة',
    description: 'باقات مميزة من التمور والعسل والمكسرات مغلفة بأناقة',
    ctaPrimary: { text: 'استكشف الهدايا', link: '/products' },
    ctaSecondary: { text: 'تواصل معنا', link: 'https://wa.me/+201276166532' },
  },
];

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

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

        // جلب العروض من database
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (offersError) {
          console.error('Error fetching offers:', offersError);
        } else if (offersData) {
          const currentDate = new Date();
          const validOffers = offersData.filter(offer => {
            const endDate = new Date(offer.end_date);
            const startDate = new Date(offer.start_date);
            return currentDate >= startDate && currentDate <= endDate;
          });
          
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
      {/* Hero Carousel Section */}
      <section className="relative h-[700px] overflow-hidden">
        {/* Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="w-full h-full object-cover brightness-75"
              />
              {/* Multi-layer Gradient Overlays for Better Text Contrast */}
              {/* Dark overlay base */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Gradient from right (for RTL text) */}
              <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-transparent" />
              {/* Bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Radial gradient for text area */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/10 to-black/40" />
            </div>

            {/* Content */}
            <div className="relative h-full section-container flex items-center">
              <div className="max-w-2xl">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary via-secondary-dark to-primary backdrop-blur-sm border-2 border-white/30 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-2xl">
                    {heroSlides[currentSlide].badge}
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4"
                  style={{ 
                    textShadow: '3px 3px 8px rgba(0,0,0,0.8), 0px 0px 20px rgba(0,0,0,0.5), 0px 4px 15px rgba(0,0,0,0.7)',
                    lineHeight: '1.2'
                  }}
                >
                  {heroSlides[currentSlide].title}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-xl md:text-2xl font-bold text-secondary mb-4"
                  style={{
                    textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0px 0px 15px rgba(0,0,0,0.6)'
                  }}
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-lg text-white font-medium mb-10 leading-relaxed max-w-xl bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
                  style={{
                    textShadow: '1px 1px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {heroSlides[currentSlide].description}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Link
                    to={heroSlides[currentSlide].ctaPrimary.link}
                    className="btn-primary px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                  >
                    {heroSlides[currentSlide].ctaPrimary.text}
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Link>
                  
                  <a
                    href={heroSlides[currentSlide].ctaSecondary.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline px-8 py-4 text-lg font-bold hover:scale-105 transition-all"
                  >
                    {heroSlides[currentSlide].ctaSecondary.text}
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 pointer-events-none">
          <button
            onClick={prevSlide}
            className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl flex items-center justify-center text-primary transition-all hover:scale-110"
            aria-label="الشريحة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl flex items-center justify-center text-primary transition-all hover:scale-110"
            aria-label="الشريحة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 right-1/2 translate-x-1/2 flex items-center gap-3 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentSlide
                  ? 'w-12 h-3 bg-primary'
                  : 'w-3 h-3 bg-white/60 hover:bg-white/80'
              } rounded-full`}
              aria-label={`الذهاب للشريحة ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Offers Section - عرض فقط إذا كانت هناك عروض */}
      {offers.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-accent/30 to-background">
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