import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, X, BadgePercent, Heart } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Product, Category } from '@/types';
import { mapProductRow } from '@/utils/mapProduct';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Sync searchQuery if ?search= changes externally (e.g. navigating from Header)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const selectedOffer = searchParams.get('offer') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const onlyFavorites = searchParams.get('favorites') === '1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, categories(name_ar), product_variants(*)')
            .eq('is_available', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order'),
        ]);

        if (productsRes.data) {
          setProducts(productsRes.data.map(mapProductRow));
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

  // Fetch products when offer filter changes
  useEffect(() => {
    if (selectedOffer) {
      fetchProductsWithOffer(selectedOffer);
    }
  }, [selectedOffer]);

  const fetchProductsWithOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      // Get the offer details
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      if (offer) {
        let query = supabase
          .from('products')
          .select('*, categories(name_ar), product_variants(*)')
          .eq('is_available', true);

        // Filter by applicable products or categories
        if (offer.applicable_products && offer.applicable_products.length > 0) {
          query = query.in('id', offer.applicable_products);
        } else if (offer.applicable_categories && offer.applicable_categories.length > 0) {
          query = query.in('category_id', offer.applicable_categories);
        }

        const { data: productsData, error: productsError } = await query;

        if (productsError) throw productsError;

        if (productsData) {
          setProducts(productsData.map(mapProductRow));
        }
      }
    } catch (error) {
      console.error('Error fetching offer products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    // Clear offer filter when selecting category
    searchParams.delete('offer');
    setSearchParams(searchParams);
  };

  const handleOfferChange = (offerId: string) => {
    if (offerId === selectedOffer) {
      searchParams.delete('offer');
    } else {
      searchParams.set('offer', offerId);
    }
    // Clear category filter when selecting offer
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const handleSortChange = (sort: string) => {
    searchParams.set('sort', sort);
    setSearchParams(searchParams);
  };

  const handleFavoritesToggle = () => {
    if (onlyFavorites) {
      searchParams.delete('favorites');
    } else {
      searchParams.set('favorites', '1');
    }
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search query - FI?ED
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.nameAr.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query)
      );
    }

    // Filter by favorites
    if (onlyFavorites) {
      filtered = filtered.filter((p) => favoriteIds.includes(p.id));
    }

    // Filter by category
    if (selectedCategory && !selectedOffer) {
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
  }, [products, searchQuery, selectedCategory, selectedOffer, sortBy, favoriteIds, onlyFavorites]);

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
              {selectedCategoryName || (selectedOffer ? 'العروض' : 'جميع المنتجات')}
            </span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {selectedCategoryName || (selectedOffer ? 'المنتجات المشمولة في العرض' : 'جميع المنتجات')}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-24">
              <h2 className="text-lg font-bold mb-4">الفلاتر</h2>

              {/* Favorites */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">المفضلة</h3>
                <button
                  onClick={handleFavoritesToggle}
                  className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    onlyFavorites ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    عرض المفضلة فقط
                  </span>
                  <span className="text-xs font-semibold">{favoriteIds.length}</span>
                </button>
              </div>

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
              {(selectedCategory || selectedOffer || onlyFavorites) && (
                <button
                  onClick={() => {
                    searchParams.delete('category');
                    searchParams.delete('offer');
                    searchParams.delete('favorites');
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
                    className="input-rtl pr-10 w-full"
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

                  <button
                    onClick={handleFavoritesToggle}
                    className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      onlyFavorites
                        ? 'border-destructive text-destructive bg-destructive/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    المفضلة
                  </button>

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
              {(selectedCategory || selectedOffer || onlyFavorites) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">الفلاتر:</span>
                  {selectedCategory && (
                    <button
                      onClick={() => handleCategoryChange(selectedCategory)}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {selectedCategoryName}
                      <X className="w-4 h-4" />
                    </button>
                  )}
                                    {onlyFavorites && (
                    <button
                      onClick={handleFavoritesToggle}
                      className="inline-flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm"
                    >
                      <Heart className="w-3 h-3" />
                      المفضلة
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {selectedOffer && (
                    <button
                      onClick={() => handleOfferChange(selectedOffer)}
                      className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm"
                    >
                      <BadgePercent className="w-3 h-3" />
                      عرض خاص
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-2 sm:gap-3 lg:gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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

            {/* Favorites */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">المفضلة</h3>
              <button
                onClick={() => {
                  handleFavoritesToggle();
                  setShowFilters(false);
                }}
                className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  onlyFavorites ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  عرض المفضلة فقط
                </span>
                <span className="text-xs font-semibold">{favoriteIds.length}</span>
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
            {(selectedCategory || selectedOffer || onlyFavorites) && (
              <button
                onClick={() => {
                  searchParams.delete('category');
                  searchParams.delete('offer');
                  searchParams.delete('favorites');
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

