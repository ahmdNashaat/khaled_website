import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Product } from '@/types';
import { mapProductRow } from '@/utils/mapProduct';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FavoritesPage = () => {
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favoriteIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name_ar), product_variants(*)')
          .in('id', favoriteIds);

        if (error) throw error;

        if (data) {
          const mapped = data.map(mapProductRow);

          const orderMap = new Map(favoriteIds.map((id, index) => [id, index]));
          mapped.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
          setProducts(mapped);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.error('حدث خطأ أثناء تحميل المفضلة');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteIds]);

  const hasFavorites = favoriteIds.length > 0;
  const favoritesCount = useMemo(() => favoriteIds.length, [favoriteIds]);

  return (
    <Layout>
      <div className="section-container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-muted-foreground mb-2">
              <Link to="/" className="hover:text-primary">الرئيسية</Link>
              <span className="mx-2">/</span>
              <span className="text-primary">المفضلة</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Heart className="w-7 h-7 text-destructive" />
              المفضلة
              {favoritesCount > 0 && (
                <span className="text-sm font-semibold text-muted-foreground">({favoritesCount})</span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              المنتجات التي حفظتها للرجوع إليها لاحقً.
            </p>
          </div>

          {hasFavorites && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                clearFavorites();
                toast.success('تم مسح المفضلة');
              }}
            >
              <Trash2 className="w-4 h-4" />
              مسح المفضلة
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : hasFavorites && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold mb-2">لا توجد مفضلة حتى الآن</h3>
            <p className="text-muted-foreground mb-6">
              ابدأ بتصفح المنتجات واحفظ أفضل اختياراتك.
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              تصفح المنتجات
            </Link>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
