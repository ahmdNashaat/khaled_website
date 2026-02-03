import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isLiked, setIsLiked] = useState(false);

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
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة', {
      duration: 1500,
    });
  };

  // Generate random rating for demo (في المشروع الحقيقي هتجيب من الداتابيز)
  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 50) + 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="group"
    >
      <Link 
        to={`/products/${product.id}`} 
        className="block bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/50 hover:border-primary/30"
      >
        {/* === IMAGE CONTAINER === */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-accent">
          {/* Main Image */}
          <motion.img
            src={product.mainImage}
            alt={product.nameAr}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* === BADGES === */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
            {/* Discount Badge */}
            {product.discountPercentage && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
              >
                <span className="text-lg">🔥</span>
                -{product.discountPercentage}%
              </motion.span>
            )}

            {/* Featured Badge */}
            {product.isFeatured && !product.discountPercentage && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                className="bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
              >
                <span className="text-lg">⭐</span>
                مميز
              </motion.span>
            )}

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all ${
                isLiked 
                  ? 'bg-destructive text-white' 
                  : 'bg-white/90 text-muted-foreground hover:text-destructive'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* === QUICK ACTIONS (SHOW ON HOVER) === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 px-4 flex items-center justify-center gap-3 z-10"
          >
            {product.isAvailable && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">أضف للسلة</span>
                  <span className="sm:hidden">إضافة</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 bg-white text-foreground rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
                >
                  <Eye className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </motion.div>

          {/* === OUT OF STOCK OVERLAY === */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-destructive text-destructive-foreground px-6 py-3 rounded-xl font-bold text-lg shadow-2xl"
              >
                غير متوفر حالياً
              </motion.div>
            </div>
          )}
        </div>

        {/* === CONTENT === */}
        <div className="p-4 space-y-2">
          {/* Category Tag */}
          <div className="flex items-center justify-between">
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {product.categoryName}
            </span>
            
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span className="text-sm font-bold text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.nameAr}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {product.shortDescription}
          </p>

          {/* === PRICE SECTION === */}
          <div className="pt-2 flex items-end justify-between border-t border-border">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">
                  {product.basePrice}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  جنيه
                </span>
              </div>
              
              {product.originalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {product.originalPrice} جنيه
                  </span>
                  <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                    وفر {product.originalPrice - product.basePrice} جنيه
                  </span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                السعر لكل {product.unit}
              </p>
            </div>

            {/* Mobile Add to Cart (Show Always) */}
            {product.isAvailable && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                className="sm:hidden w-12 h-12 bg-primary text-primary-foreground rounded-xl shadow-lg flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Sizes Preview (Optional) */}
          {product.sizes.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground">المتوفر:</span>
              {product.sizes.slice(0, 3).map((size) => (
                <span
                  key={size.id}
                  className="text-xs bg-muted px-2 py-0.5 rounded-md text-foreground"
                >
                  {size.label}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="text-xs text-primary font-semibold">
                  +{product.sizes.length - 3}
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