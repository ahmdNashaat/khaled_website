import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const isLiked = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, product.sizes[0]);
    toast.success('تمت الإضافة إلى السلة', {
      description: product.nameAr,
      duration: 2000,
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasLiked = isLiked;
    toggleFavorite(product.id);
    toast.success(wasLiked ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة', {
      duration: 1500,
    });
  };

  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 50) + 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
      }}
      className="group"
    >
      <Link
        to={`/products/${product.id}`}
        className="block bg-card rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30"
      >
        {/* IMAGE - MOBILE OPTIMIZED */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-accent">
          <motion.img
            src={product.mainImage}
            alt={product.nameAr}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* BADGES - COMPACT */}
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-start justify-between z-10">
            {product.discountPercentage && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md">
                -{product.discountPercentage}%
              </span>
            )}

            {product.isFeatured && !product.discountPercentage && (
              <span className="bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md">
                ⭐ مميز
              </span>
            )}

            {/* LIKE BUTTON - TOUCH TARGET */}
            <button
              onClick={handleLike}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all ${
                isLiked
                  ? 'bg-destructive text-white'
                  : 'bg-white/90 text-muted-foreground hover:text-destructive'
              }`}
              aria-label="إضافة للمفضلة"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* QUICK ACTIONS - MOBILE OPTIMIZED */}
          <div className="absolute inset-x-0 bottom-2 sm:bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 px-2 sm:px-3 flex items-center justify-center gap-2 z-10">
            {product.isAvailable && (
              <>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 min-h-[44px] bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف</span>
                </button>
                <button
                  className="w-11 h-11 bg-white text-foreground rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                  aria-label="عرض سريع"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* OUT OF STOCK */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-destructive text-destructive-foreground px-3 sm:px-4 py-2 rounded-lg text-sm font-bold shadow-xl">
                غير متوفر
              </div>
            </div>
          )}
        </div>

        {/* CONTENT - COMPACT */}
        <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5">
          {/* CATEGORY & RATING */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {product.categoryName}
            </span>

            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              <span className="text-sm font-bold text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          </div>

          {/* PRODUCT NAME */}
          <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.nameAr}
          </h3>

          {/* DESCRIPTION - HIDDEN ON VERY SMALL SCREENS */}
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 leading-relaxed hidden xs:block">
            {product.shortDescription}
          </p>

          {/* PRICE SECTION - COMPACT */}
          <div className="pt-1 sm:pt-1.5 flex items-end justify-between border-t border-border">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-primary">
                  {product.basePrice}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  جنيه
                </span>
              </div>

              {product.originalPrice && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {product.originalPrice}
                  </span>
                  <span className="text-xs font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                    وفر {product.originalPrice - product.basePrice}
                  </span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                السعر لكل {product.unit}
              </p>
            </div>

            {/* MOBILE ADD TO CART */}
            {product.isAvailable && (
              <button
                onClick={handleAddToCart}
                className="sm:hidden w-11 h-11 bg-primary text-primary-foreground rounded-lg shadow-md flex items-center justify-center active:scale-95 transition-transform"
                aria-label="أضف إلى السلة"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* SIZES - COMPACT */}
          {product.sizes.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-xs text-muted-foreground">المتوفر:</span>
              {product.sizes.slice(0, 2).map((size) => (
                <span
                  key={size.id}
                  className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground"
                >
                  {size.label}
                </span>
              ))}
              {product.sizes.length > 2 && (
                <span className="text-xs text-primary font-semibold">
                  +{product.sizes.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
