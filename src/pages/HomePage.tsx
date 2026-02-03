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

// Hero Slides Data - ENHANCED
const heroSlides = [
  {
    id: 1,
    image: '/hero-slide-1.jpg', 
    badge: '🌙 رمضان كريم',
    title: 'أسهل مكان للعثور على هدايا المناسبات',
    subtitle: 'مجموعة مذاق المتميزة من التمور',
    description: 'باقات مميزة من التمور والعسل والمكسرات بأفضل جودة وسعر لشهر رمضان',
    ctaPrimary: { text: 'اكتشف الهدايا', link: '/products' },
    ctaSecondary: { text: 'تواصل معنا', link: 'https://wa.me/+201276166532' },
    gradient: 'from-primary/90 via-primary/70 to-transparent',
  },
  {
    id: 2,
    image: '/hero-slide-2.jpg',
    badge: '✨ عروض خاصة',
    title: 'تمور عربية فاخرة',
    subtitle: 'من أرقى المزارع السعودية',
    description: 'تمور طازجة ومختارة بعناية لتقديم أفضل طعم وجودة لعائلتك',
    ctaPrimary: { text: 'تسوق التمور', link: '/products' },
    ctaSecondary: { text: 'اطلب الآن', link: 'https://wa.me/+201276166532' },
    gradient: 'from-secondary/90 via-secondary/70 to-transparent',
  },
  {
    id: 3,
    image: '/hero-slide-3.jpg',
    badge: '🍯 عسل طبيعي',
    title: 'عسل نحل طبيعي 100%',
    subtitle: 'من أجود المناحل',
    description: 'عسل طبيعي بدون أي إضافات أو مواد حافظة - غني بالفوائد الصحية',
    ctaPrimary: { text: 'اشترِ الآن', link: '/products' },
    ctaSecondary: { text: 'واتساب', link: 'https://wa.me/+201276166532' },
    gradient: 'from-primary-dark/90 via-primary-dark/70 to-transparent',
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
  const [direction, setDirection] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <Layout>
      {/* ===== ENHANCED HERO SECTION ===== */}
      <section className="relative h-[600px] sm:h-[700px] lg:h-[750px] overflow-hidden bg-muted">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
            }}
            className="absolute inset-0"
          >
            {/* Background Image with Better Brightness */}
            <div className="absolute inset-0">
              <img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.75)' }}
              />
              {/* Enhanced Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-l ${heroSlides[currentSlide].gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="section-container">
                <div className="max-w-2xl">
                  {/* Badge with Animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block mb-4"
                  >
                    <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-semibold text-sm border border-white/30 shadow-lg">
                      {heroSlides[currentSlide].badge}
                    </span>
                  </motion.div>

                  {/* Title with Strong Shadow */}
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
                    style={{
                      textShadow: '3px 3px 10px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7)',
                    }}
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl sm:text-2xl text-white/95 font-semibold mb-3"
                    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-base sm:text-lg text-white/90 mb-8 max-w-xl"
                    style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.9)' }}
                  >
                    {heroSlides[currentSlide].description}
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-4"
                  >
                    <Link
                      to={heroSlides[currentSlide].ctaPrimary.link}
                      className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:scale-105 hover:shadow-3xl transition-all"
                    >
                      {heroSlides[currentSlide].ctaPrimary.text}
                      <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <a
                      href={heroSlides[currentSlide].ctaSecondary.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border-2 border-white/40 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:bg-white/20 hover:scale-105 transition-all"
                    >
                      {heroSlides[currentSlide].ctaSecondary.text}
                    </a>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center text-white shadow-xl transition-all border border-white/30"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center text-white shadow-xl transition-all border border-white/30"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
          {heroSlides.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index
                  ? 'bg-white w-12'
                  : 'bg-white/50 w-2 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Offers Section - عرض فقط إذا كانت هناك عروض */}
      {offers.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-accent/30 to-background">
          <div className="section-container">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-3"
              >
                <span className="text-primary">عروض</span> رمضان الحصرية
              </motion.h2>
              <p className="text-muted-foreground text-lg">لا تفوت فرصة الحصول على أفضل العروض</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group"
                >
                  {/* صورة العرض */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={offer.banner_image}
                      alt={offer.title_ar}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {offer.discount_percentage && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="absolute top-4 right-4 bg-gradient-to-br from-secondary to-secondary-light text-secondary-foreground px-5 py-2.5 rounded-full font-black text-lg shadow-xl"
                      >
                        خصم {offer.discount_percentage}%
                      </motion.div>
                    )}
                  </div>
                  
                  {/* تفاصيل العرض */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {offer.title_ar}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {offer.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-EG')}
                      </span>
                      <Link 
                        to={`/products?offer=${offer.id}`} 
                        className="text-primary hover:text-primary-dark font-bold flex items-center gap-1 group/link"
                      >
                        تسوق الآن
                        <ArrowLeft className="w-4 h-4 group-hover/link:-translate-x-1 transition-transform" />
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
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              تصفح <span className="text-primary">الأقسام</span>
            </motion.h2>
            <p className="text-muted-foreground text-lg">اختر من تشكيلتنا المتنوعة من المنتجات</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              >
                منتجاتنا <span className="text-primary">المميزة</span>
              </motion.h2>
              <p className="text-muted-foreground text-lg">أكثر المنتجات طلباً في متجرنا</p>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors group"
            >
              عرض الكل
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
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
            <p className="text-muted-foreground text-lg">نحرص على تقديم أفضل تجربة تسوق لعملائنا</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-2xl transition-all border border-border/50"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg"
                >
                  {benefit.icon}
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary-dark to-primary">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl sm:text-7xl mb-6 block"
            >
              🌙
            </motion.span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-foreground mb-5">
              رمضان كريم
            </h2>
            <p className="text-lg sm:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              استعد لشهر رمضان المبارك مع أجود المنتجات الطبيعية. اطلب الآن واستمتع بتوصيل سريع لمنزلك.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-white text-primary px-10 py-5 rounded-xl font-black text-lg sm:text-xl shadow-2xl hover:shadow-3xl transition-all"
              >
                تسوق الآن
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;