import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, categories(name_ar)')
            .eq('is_available', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order'),
        ]);

        if (productsRes.data) {
          setProducts(
            productsRes.data.map((p) => ({
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

        if (categoriesRes.data) {
          setCategories(
            categoriesRes.data.map((c) => ({
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
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (sort: string) => {
    searchParams.set('sort', sort);
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.nameAr.includes(searchQuery) ||
        p.shortDescription.includes(searchQuery) ||
        p.categoryName.includes(searchQuery)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'newest':
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.nameAr;

  return (
    <Layout>
      <div className="section-container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <span>الرئيسية</span>
            <span className="mx-2">/</span>
            <span className="text-primary">
              {selectedCategoryName || 'جميع المنتجات'}
            </span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {selectedCategoryName || 'جميع المنتجات'}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-24">
              <h2 className="text-lg font-bold mb-4">الفلاتر</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">الأقسام</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-right px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span>{category.nameAr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {selectedCategory && (
                <button
                  onClick={() => {
                    searchParams.delete('category');
                    setSearchParams(searchParams);
                  }}
                  className="w-full py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Controls */}
            <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-rtl pr-10"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="input-rtl py-2 min-w-[150px]"
                  >
                    <option value="newest">الأحدث</option>
                    <option value="price-low">السعر: من الأقل للأعلى</option>
                    <option value="price-high">السعر: من الأعلى للأقل</option>
                  </select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden p-2 border rounded-lg hover:bg-muted"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-muted-foreground mt-4">
                عرض {filteredProducts.length} من {products.length} منتج
              </p>

              {/* Active Filters */}
              {selectedCategory && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-muted-foreground">الفلاتر:</span>
                  <button
                    onClick={() => handleCategoryChange(selectedCategory)}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {selectedCategoryName}
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">
                  لم نتمكن من إيجاد منتجات تطابق بحثك
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFilters(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">الفلاتر</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">الأقسام</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategoryChange(category.id);
                      setShowFilters(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span>{category.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {selectedCategory && (
              <button
                onClick={() => {
                  searchParams.delete('category');
                  setSearchParams(searchParams);
                  setShowFilters(false);
                }}
                className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl font-medium"
              >
                مسح الفلاتر
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
};

export default ProductsPage;
